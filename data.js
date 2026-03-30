// 初始資料（執行 setup.sh 後將由 fetch_stocks.py 自動覆蓋為即時資料）
// 請執行: bash backend/setup.sh

const STOCK_DATA = [
  {
    "date": "2025-11-10",
    "valueStocks": [
      { "ticker": "CMCSA", "name": "康卡斯特",              "pe_ratio": 4.55,  "current_price": 34.15,  "low_52w": 30.80, "distance_from_low": 10.9, "market_cap": 125.8, "daily_volume": 25.3, "sector": "電信",     "dividend_yield": 2.1, "risk_level": "中",   "recommendation": "" },
      { "ticker": "CHTR",  "name": "Charter Communications", "pe_ratio": 5.78,  "current_price": 58.37,  "low_52w": 45.20, "distance_from_low": 29.2, "market_cap": 55.6,  "daily_volume": 5.8,  "sector": "電信",     "dividend_yield": 2.5, "risk_level": "中高", "recommendation": "" },
      { "ticker": "APA",   "name": "APA公司",                "pe_ratio": 5.91,  "current_price": 21.64,  "low_52w": 19.80, "distance_from_low": 9.3,  "market_cap": 7.74,  "daily_volume": 4.2,  "sector": "能源",     "dividend_yield": 0.0, "risk_level": "高",   "recommendation": "" },
      { "ticker": "ALL",   "name": "Allstate公司",           "pe_ratio": 6.69,  "current_price": 45.20,  "low_52w": 42.10, "distance_from_low": 7.3,  "market_cap": 35.2,  "daily_volume": 8.9,  "sector": "保險",     "dividend_yield": 3.2, "risk_level": "中",   "recommendation": "" },
      { "ticker": "EIX",   "name": "Edison International",   "pe_ratio": 7.09,  "current_price": 28.50,  "low_52w": 26.40, "distance_from_low": 8.0,  "market_cap": 18.9,  "daily_volume": 6.2,  "sector": "公用事業", "dividend_yield": 4.1, "risk_level": "中",   "recommendation": "" },
      { "ticker": "VZ",    "name": "Verizon",                "pe_ratio": 10.22, "current_price": 42.10,  "low_52w": 39.50, "distance_from_low": 6.6,  "market_cap": 185.3, "daily_volume": 17.3, "sector": "電信",     "dividend_yield": 6.16,"risk_level": "低",   "recommendation": "優先推薦" },
      { "ticker": "COP",   "name": "ConocoPhillips",         "pe_ratio": 9.80,  "current_price": 58.75,  "low_52w": 55.80, "distance_from_low": 5.4,  "market_cap": 75.6,  "daily_volume": 7.5,  "sector": "能源",     "dividend_yield": 2.8, "risk_level": "中低", "recommendation": "推薦買入" },
      { "ticker": "XOM",   "name": "埃克森美孚",             "pe_ratio": 8.50,  "current_price": 115.20, "low_52w": 108.10,"distance_from_low": 6.6,  "market_cap": 454.1, "daily_volume": 12.0, "sector": "能源",     "dividend_yield": 3.5, "risk_level": "中低", "recommendation": "" },
      { "ticker": "PFE",   "name": "Pfizer",                 "pe_ratio": 9.20,  "current_price": 28.40,  "low_52w": 26.10, "distance_from_low": 8.8,  "market_cap": 138.7, "daily_volume": 11.0, "sector": "醫療",     "dividend_yield": 6.2, "risk_level": "中低", "recommendation": "" },
      { "ticker": "MRK",   "name": "Merck",                  "pe_ratio": 8.80,  "current_price": 65.50,  "low_52w": 60.20, "distance_from_low": 8.8,  "market_cap": 280.5, "daily_volume": 9.5,  "sector": "醫療",     "dividend_yield": 3.8, "risk_level": "低",   "recommendation": "優先推薦" }
    ],
    "momentumStocks": [
      { "ticker": "LLY",  "name": "禮來",        "five_day_return": 10.9, "rsi_14": 68.5, "roc_14": 12.5, "roc_21": 18.2, "status": "超買接近", "outlook": "謹慎", "trend": "高於所有均線" },
      { "ticker": "CSCO", "name": "Cisco",       "five_day_return": 9.8,  "rsi_14": 65.2, "roc_14": 10.8, "roc_21": 15.3, "status": "超買接近", "outlook": "謹慎", "trend": "高於50/200MA" },
      { "ticker": "MRK",  "name": "Merck",       "five_day_return": 7.7,  "rsi_14": 62.8, "roc_14": 9.5,  "roc_21": 13.8, "status": "中性",    "outlook": "樂觀", "trend": "高於所有均線" },
      { "ticker": "ABBV", "name": "AbbVie",      "five_day_return": 6.0,  "rsi_14": 58.9, "roc_14": 7.2,  "roc_21": 10.5, "status": "中性",    "outlook": "樂觀", "trend": "高於所有均線" },
      { "ticker": "AMD",  "name": "AMD",         "five_day_return": 5.7,  "rsi_14": 61.5, "roc_14": 8.9,  "roc_21": 12.4, "status": "中性",    "outlook": "樂觀", "trend": "高於50/200MA" },
      { "ticker": "DHR",  "name": "Danaher",     "five_day_return": 5.4,  "rsi_14": 59.2, "roc_14": 6.6,  "roc_21": 9.4,  "status": "中性",    "outlook": "樂觀", "trend": "高於20/50MA"  },
      { "ticker": "COP",  "name": "ConocoPhillips","five_day_return": 5.2,"rsi_14": 58.7, "roc_14": 7.1,  "roc_21": 10.2, "status": "中性",    "outlook": "樂觀", "trend": "高於所有均線" },
      { "ticker": "GILD", "name": "吉利德科學",  "five_day_return": 5.2,  "rsi_14": 57.3, "roc_14": 6.3,  "roc_21": 9.1,  "status": "中性",    "outlook": "樂觀", "trend": "高於50/200MA" },
      { "ticker": "AMGN", "name": "Amgen",       "five_day_return": 5.2,  "rsi_14": 56.8, "roc_14": 5.8,  "roc_21": 8.3,  "status": "中性",    "outlook": "樂觀", "trend": "高於所有均線" },
      { "ticker": "NKE",  "name": "Nike",        "five_day_return": 5.0,  "rsi_14": 54.2, "roc_14": 5.2,  "roc_21": 7.5,  "status": "中性",    "outlook": "樂觀", "trend": "高於20/50MA"  }
    ]
  }
];
