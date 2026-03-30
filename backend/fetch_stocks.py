#!/usr/bin/env python3
"""
Stock Analysis Dashboard - Weekly Data Fetcher
每週自動從 Yahoo Finance 抓取股票數據，計算技術指標，
並生成 data.js 供前端儀表板使用，同時儲存歷史資料。
"""

import json
import os
import sys
from datetime import datetime, date

try:
    import yfinance as yf
    import numpy as np
    import pandas as pd
except ImportError:
    print("ERROR: 缺少必要套件，請執行 setup.sh 安裝")
    sys.exit(1)

# ── 路徑設定 ────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
DATA_DIR   = os.path.join(ROOT_DIR, "data")
HISTORY_FILE  = os.path.join(DATA_DIR, "stock_history.json")
DATA_JS_FILE  = os.path.join(ROOT_DIR, "data.js")
CONFIG_FILE   = os.path.join(SCRIPT_DIR, "stock_config.json")
LOG_DIR       = os.path.join(SCRIPT_DIR, "logs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR,  exist_ok=True)

# ── 載入靜態設定 ────────────────────────────────────────────
with open(CONFIG_FILE, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

VALUE_TICKERS    = [s["ticker"] for s in CONFIG["value_stocks"]]
MOMENTUM_TICKERS = [s["ticker"] for s in CONFIG["momentum_stocks"]]
ALL_TICKERS      = list(dict.fromkeys(VALUE_TICKERS + MOMENTUM_TICKERS))  # preserve order, dedupe


# ═══════════════════════════════════════════════════════════
# 技術指標計算
# ═══════════════════════════════════════════════════════════

def calc_rsi(prices: pd.Series, period: int = 14):
    if len(prices) < period + 2:
        return None
    delta = prices.diff().dropna()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, float("nan"))
    rsi   = 100 - (100 / (1 + rs))
    val   = rsi.iloc[-1]
    return round(float(val), 1) if pd.notna(val) else None


def calc_roc(prices: pd.Series, period: int):
    if len(prices) < period + 1:
        return None
    roc = (prices.iloc[-1] - prices.iloc[-period - 1]) / prices.iloc[-period - 1] * 100
    return round(float(roc), 1)


def get_trend(prices: pd.Series) -> str:
    if len(prices) < 200:
        return "資料不足"
    cur   = prices.iloc[-1]
    ma20  = prices.rolling(20).mean().iloc[-1]
    ma50  = prices.rolling(50).mean().iloc[-1]
    ma200 = prices.rolling(200).mean().iloc[-1]
    above = sum([cur > ma200, cur > ma50, cur > ma20])
    if above == 3:
        return "高於所有均線"
    if cur > ma200 and cur > ma50:
        return "高於50/200MA"
    if cur > ma50 and cur > ma20:
        return "高於20/50MA"
    if cur > ma200:
        return "高於200MA"
    return "低於主要均線"


def rsi_status(rsi) -> str:
    if rsi is None:
        return "無資料"
    if rsi >= 70:
        return "超買接近"
    if rsi >= 50:
        return "中性"
    if rsi >= 30:
        return "偏弱"
    return "超賣"


def outlook(rsi, ret5d, roc14) -> str:
    if rsi is None or rsi >= 70:
        return "謹慎"
    if (ret5d or 0) > 0 and (roc14 or 0) > 0:
        return "樂觀"
    return "觀望"


# ═══════════════════════════════════════════════════════════
# 單支股票資料抓取
# ═══════════════════════════════════════════════════════════

def fetch_ticker(ticker: str) -> dict | None:
    print(f"  [{ticker}] 抓取中...")
    try:
        stk  = yf.Ticker(ticker)
        info = stk.info
        hist = stk.history(period="1y")

        if hist.empty or len(hist) < 20:
            print(f"  [{ticker}] ⚠ 歷史資料不足，跳過")
            return None

        closes = hist["Close"].dropna()

        # 價格與基本面
        price  = (info.get("currentPrice")
                  or info.get("regularMarketPrice")
                  or float(closes.iloc[-1]))
        pe     = info.get("trailingPE") or 0
        mcap   = (info.get("marketCap") or 0) / 1e9
        vol    = ((info.get("averageDailyVolume10Day")
                   or info.get("averageVolume") or 0)) / 1e6
        div    = (info.get("dividendYield") or 0) * 100
        low52  = info.get("fiftyTwoWeekLow") or float(closes.min())
        dist   = (price - low52) / low52 * 100 if low52 > 0 else 0

        # 技術指標
        rsi    = calc_rsi(closes)
        ret5d  = calc_roc(closes, 5)
        roc14  = calc_roc(closes, 14)
        roc21  = calc_roc(closes, 21)
        trend  = get_trend(closes)

        return {
            "ticker":            ticker,
            "current_price":     round(float(price),  2),
            "pe_ratio":          round(float(pe),     2) if pe else 0,
            "market_cap":        round(float(mcap),   1),
            "daily_volume":      round(float(vol),    1),
            "dividend_yield":    round(float(div),    2),
            "low_52w":           round(float(low52),  2),
            "distance_from_low": round(float(dist),   1),
            "five_day_return":   ret5d  or 0,
            "rsi_14":            rsi    or 0,
            "roc_14":            roc14  or 0,
            "roc_21":            roc21  or 0,
            "status":            rsi_status(rsi),
            "outlook":           outlook(rsi, ret5d, roc14),
            "trend":             trend,
        }
    except Exception as exc:
        print(f"  [{ticker}] ✗ 錯誤: {exc}")
        return None


# ═══════════════════════════════════════════════════════════
# 組合最終資料
# ═══════════════════════════════════════════════════════════

def build_value_stock(raw: dict, cfg: dict) -> dict:
    return {
        "ticker":            raw["ticker"],
        "name":              cfg.get("name", raw["ticker"]),
        "pe_ratio":          raw["pe_ratio"],
        "current_price":     raw["current_price"],
        "low_52w":           raw["low_52w"],
        "distance_from_low": raw["distance_from_low"],
        "market_cap":        raw["market_cap"],
        "daily_volume":      raw["daily_volume"],
        "sector":            cfg.get("sector", ""),
        "dividend_yield":    raw["dividend_yield"],
        "risk_level":        cfg.get("risk_level", "中"),
        "recommendation":    cfg.get("recommendation", ""),
    }


def build_momentum_stock(raw: dict, cfg: dict) -> dict:
    return {
        "ticker":          raw["ticker"],
        "name":            cfg.get("name", raw["ticker"]),
        "five_day_return": raw["five_day_return"],
        "rsi_14":          raw["rsi_14"],
        "roc_14":          raw["roc_14"],
        "roc_21":          raw["roc_21"],
        "status":          raw["status"],
        "outlook":         raw["outlook"],
        "trend":           raw["trend"],
    }


def fetch_all() -> dict:
    print("\n📡 開始抓取所有股票資料...\n")
    raw = {}
    for t in ALL_TICKERS:
        result = fetch_ticker(t)
        if result:
            raw[t] = result

    v_cfg = {s["ticker"]: s for s in CONFIG["value_stocks"]}
    m_cfg = {s["ticker"]: s for s in CONFIG["momentum_stocks"]}

    value_stocks = [
        build_value_stock(raw[t], v_cfg[t])
        for t in VALUE_TICKERS if t in raw
    ]
    momentum_stocks = sorted(
        [build_momentum_stock(raw[t], m_cfg[t]) for t in MOMENTUM_TICKERS if t in raw],
        key=lambda x: x["five_day_return"],
        reverse=True,
    )

    today = date.today().isoformat()
    print(f"\n✅ 完成: 價值股 {len(value_stocks)} 支 / 動能股 {len(momentum_stocks)} 支")
    return {
        "date":           today,
        "valueStocks":    value_stocks,
        "momentumStocks": momentum_stocks,
    }


# ═══════════════════════════════════════════════════════════
# 歷史資料管理
# ═══════════════════════════════════════════════════════════

def load_history() -> list:
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_history(history: list):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


# ═══════════════════════════════════════════════════════════
# 生成 data.js
# ═══════════════════════════════════════════════════════════

def generate_data_js(history: list):
    ts  = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    js  = (
        f"// 自動生成 by fetch_stocks.py\n"
        f"// 最後更新: {ts}\n"
        f"// 共 {len(history)} 週歷史資料 — 請勿手動編輯\n\n"
        f"const STOCK_DATA = {json.dumps(history, ensure_ascii=False, indent=2)};\n"
    )
    with open(DATA_JS_FILE, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"📄 data.js 已生成（{len(history)} 週資料）")


# ═══════════════════════════════════════════════════════════
# 主程式
# ═══════════════════════════════════════════════════════════

def main():
    print("=" * 55)
    print(f"  Stock Dashboard 週更新  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 55)

    new_data = fetch_all()
    history  = load_history()

    # 同一天的資料覆蓋（重跑不重複）
    history = [h for h in history if h["date"] != new_data["date"]]
    history.insert(0, new_data)   # 最新在前
    history = history[:52]        # 保留最近 52 週

    save_history(history)
    print(f"💾 歷史資料已儲存（{len(history)} 週）")

    generate_data_js(history)
    print("\n🎉 更新完成！請重新整理瀏覽器查看最新資料。\n")


if __name__ == "__main__":
    main()
