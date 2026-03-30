#!/bin/bash
# ============================================================
#  Stock Analysis Dashboard - 初始化安裝腳本
#  執行方式: bash backend/setup.sh
# ============================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"
VENV_DIR="$SCRIPT_DIR/venv"
PLIST_NAME="com.stockdashboard.weekly"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "================================================"
echo "  Stock Dashboard 安裝程式"
echo "================================================"
echo ""

# ── 1. 建立 Python 虛擬環境 ────────────────────────────────
echo "▶ 建立 Python 虛擬環境..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo "  ✓ 虛擬環境建立完成: $VENV_DIR"
else
    echo "  ✓ 虛擬環境已存在，略過"
fi

# ── 2. 安裝 Python 套件 ────────────────────────────────────
echo ""
echo "▶ 安裝 Python 套件（yfinance / pandas / numpy）..."
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"
echo "  ✓ 套件安裝完成"

# ── 3. 建立目錄 ────────────────────────────────────────────
mkdir -p "$ROOT_DIR/data"
mkdir -p "$SCRIPT_DIR/logs"

# ── 4. 首次執行，生成初始 data.js ──────────────────────────
echo ""
echo "▶ 首次抓取股票資料（約需 1-2 分鐘）..."
"$VENV_DIR/bin/python3" "$SCRIPT_DIR/fetch_stocks.py"

# ── 5. 建立 launchd plist（每週一早上 8:00 自動執行）────────
echo ""
echo "▶ 設定每週自動更新排程（週一 08:00）..."

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_DST" << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${VENV_DIR}/bin/python3</string>
        <string>${SCRIPT_DIR}/fetch_stocks.py</string>
    </array>

    <!-- 每週一早上 08:00 執行 -->
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key><integer>1</integer>
        <key>Hour</key><integer>8</integer>
        <key>Minute</key><integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/logs/fetch.log</string>

    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/logs/fetch_error.log</string>

    <!-- 電腦開機時若錯過排程，不補跑 -->
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
PLIST_EOF

# 載入 launchd 排程
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"
echo "  ✓ 排程已啟用（每週一 08:00 自動更新）"

# ── 6. 生成手動執行腳本 ────────────────────────────────────
cat > "$ROOT_DIR/update_now.sh" << 'EOF_SCRIPT'
#!/bin/bash
# 手動立即更新股票資料
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "正在更新股票資料..."
"$SCRIPT_DIR/backend/venv/bin/python3" "$SCRIPT_DIR/backend/fetch_stocks.py"
echo ""
echo "完成！請重新整理瀏覽器查看最新資料。"
EOF_SCRIPT
chmod +x "$ROOT_DIR/update_now.sh"

echo ""
echo "================================================"
echo "  ✅ 安裝完成！"
echo "================================================"
echo ""
echo "  📅 自動更新: 每週一早上 08:00"
echo "  🔄 手動更新: bash update_now.sh"
echo "  📋 執行記錄: backend/logs/fetch.log"
echo ""
echo "  開啟儀表板: 用瀏覽器打開 index.html"
echo ""
