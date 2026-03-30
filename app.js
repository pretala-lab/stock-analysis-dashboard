// ============================================================
//  Stock Analysis Dashboard — app.js
//  資料來源: data.js (由 backend/fetch_stocks.py 自動生成)
// ============================================================

// ── 歷史資料載入 ─────────────────────────────────────────────
const stockHistory = (typeof STOCK_DATA !== 'undefined' && STOCK_DATA.length > 0)
  ? STOCK_DATA : [];

let currentWeekIndex = 0;

function currentData() {
  return stockHistory[currentWeekIndex] || { date: '—', valueStocks: [], momentumStocks: [] };
}

// ── 導覽 ──────────────────────────────────────────────────────
function navigateToPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navigateToPage(link.getAttribute('data-page'));
  });
});

// ── 週別選擇器 ────────────────────────────────────────────────
function renderWeekSelectors() {
  document.querySelectorAll('.week-selector-host').forEach(host => {
    if (stockHistory.length === 0) {
      host.innerHTML = '<span class="data-status">⚠ 尚無即時資料，顯示初始資料。執行 bash backend/setup.sh 完成初始化。</span>';
      return;
    }
    const opts = stockHistory.map((w, i) =>
      `<option value="${i}" ${i === currentWeekIndex ? 'selected' : ''}>${w.date}${i === 0 ? ' ✦ 最新' : ''}</option>`
    ).join('');
    host.innerHTML = `
      <div class="week-selector">
        <span class="week-label">📅 資料週期</span>
        <select class="week-select">${opts}</select>
        <span class="week-count">共 ${stockHistory.length} 週記錄</span>
      </div>`;
    host.querySelector('select').addEventListener('change', e => changeWeek(parseInt(e.target.value)));
  });
}

function changeWeek(index) {
  currentWeekIndex = index;
  document.querySelectorAll('.week-select').forEach(s => { s.value = index; });
  const d = currentData();
  renderValueTable(d.valueStocks);
  renderMomentumTable(d.momentumStocks);
  updateHomeStats();
}

// ── 首頁統計更新 ───────────────────────────────────────────────
function updateHomeStats() {
  const d  = currentData();
  const vs = d.valueStocks   || [];
  const ms = d.momentumStocks || [];
  if (!vs.length && !ms.length) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  if (vs.length) {
    const avgPE  = vs.reduce((s, x) => s + x.pe_ratio, 0) / vs.length;
    const minPE  = vs.reduce((a, b) => a.pe_ratio < b.pe_ratio ? a : b);
    const maxDiv = vs.reduce((a, b) => a.dividend_yield > b.dividend_yield ? a : b);
    set('stat-value-count', `${vs.length} 支`);
    set('stat-avg-pe',      avgPE.toFixed(2));
    set('stat-min-pe',      `${minPE.pe_ratio.toFixed(2)} (${minPE.ticker})`);
    set('stat-max-div',     `${maxDiv.dividend_yield.toFixed(1)}% (${maxDiv.ticker})`);
  }
  if (ms.length) {
    const maxRet  = ms.reduce((a, b) => a.five_day_return > b.five_day_return ? a : b);
    const avgRSI  = ms.reduce((s, x) => s + x.rsi_14, 0) / ms.length;
    const bullish = ms.filter(x => x.outlook === '樂觀').length;
    set('stat-momentum-count', `${ms.length} 支`);
    set('stat-max-return',     `+${maxRet.five_day_return.toFixed(1)}% (${maxRet.ticker})`);
    set('stat-avg-rsi',        avgRSI.toFixed(1));
    set('stat-bullish',        `${bullish} 支`);
  }
  set('stat-data-date', d.date);
}

// ── 價值股表格 ────────────────────────────────────────────────
function renderValueTable(stocks) {
  const tbody = document.getElementById('valueTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  stocks.forEach(stock => {
    const row     = document.createElement('tr');
    const isCross = stock.ticker === 'MRK' || stock.ticker === 'COP';
    const badge   = isCross ? ' <span class="badge badge-success" style="font-size:10px;">★雙優</span>' : '';

    row.innerHTML = `
      <td class="ticker">${stock.ticker}${badge}</td>
      <td>${stock.name}</td>
      <td>${stock.pe_ratio.toFixed(2)}</td>
      <td>$${stock.current_price.toFixed(2)}</td>
      <td>$${stock.low_52w.toFixed(2)}</td>
      <td>${stock.distance_from_low.toFixed(1)}%</td>
      <td>$${stock.market_cap.toFixed(1)}B</td>
      <td>${stock.daily_volume.toFixed(1)}M</td>
      <td>${stock.sector}</td>
      <td class="${stock.dividend_yield > 4 ? 'positive' : ''}">${stock.dividend_yield.toFixed(1)}%</td>
      <td><span class="badge risk-${stock.risk_level}">${stock.risk_level}</span></td>
    `;
    tbody.appendChild(row);
  });
}

// ── 動能股表格 ────────────────────────────────────────────────
function renderMomentumTable(stocks) {
  const tbody = document.getElementById('momentumTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  stocks.forEach(stock => {
    const row     = document.createElement('tr');
    const isCross = stock.ticker === 'MRK' || stock.ticker === 'COP';
    const badge   = isCross ? ' <span class="badge badge-success" style="font-size:10px;">★雙優</span>' : '';

    const statusClass  = stock.status === '超買接近' ? 'badge-warning'
                       : stock.status === '超買'      ? 'badge-error' : 'badge-success';
    const outlookClass = stock.outlook === '樂觀' ? 'badge-success'
                       : stock.outlook === '謹慎'  ? 'badge-warning' : 'badge-info';

    row.innerHTML = `
      <td class="ticker">${stock.ticker}${badge}</td>
      <td>${stock.name}</td>
      <td class="positive">+${stock.five_day_return.toFixed(1)}%</td>
      <td>${stock.rsi_14.toFixed(1)}</td>
      <td class="positive">+${stock.roc_14.toFixed(1)}%</td>
      <td class="positive">+${stock.roc_21.toFixed(1)}%</td>
      <td><span class="badge ${statusClass}">${stock.status}</span></td>
      <td><span class="badge ${outlookClass}">${stock.outlook}</span></td>
      <td style="font-size:12px;">${stock.trend}</td>
    `;
    tbody.appendChild(row);
  });
}

// ── 歷史趨勢頁 ────────────────────────────────────────────────
function renderHistoryPage() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (stockHistory.length <= 1) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--color-text-secondary);">
      ${stockHistory.length === 0
        ? '尚無歷史資料。請執行 <code style="background:var(--color-secondary);padding:2px 6px;border-radius:4px;">bash backend/setup.sh</code> 完成初始化。'
        : '歷史資料累積中，至少需要 2 週資料才會顯示趨勢比對。'}
    </td></tr>`;
    return;
  }

  const TRACKED = ['MRK', 'COP', 'VZ', 'XOM', 'PFE'];

  tbody.innerHTML = '';
  stockHistory.forEach((week, wi) => {
    const vMap = Object.fromEntries((week.valueStocks || []).map(s => [s.ticker, s]));
    const mMap = Object.fromEntries((week.momentumStocks || []).map(s => [s.ticker, s]));
    const prevVMap = wi + 1 < stockHistory.length
      ? Object.fromEntries((stockHistory[wi + 1].valueStocks || []).map(s => [s.ticker, s]))
      : {};

    TRACKED.forEach((ticker, ti) => {
      const v = vMap[ticker];
      const m = mMap[ticker];
      if (!v && !m) return;

      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.title = `點擊切換到 ${week.date} 的資料`;

      let priceDiff = '';
      if (prevVMap[ticker] && v) {
        const d = v.current_price - prevVMap[ticker].current_price;
        priceDiff = `<span class="${d >= 0 ? 'positive' : 'negative'}" style="font-size:11px;">
          ${d >= 0 ? '▲' : '▼'}${Math.abs(d).toFixed(2)}</span>`;
      }

      row.innerHTML = `
        <td style="white-space:nowrap;">${ti === 0 ? `<strong>${week.date}</strong>` : ''}</td>
        <td class="ticker">${ticker}</td>
        <td>${v ? '$' + v.current_price.toFixed(2) : '—'}</td>
        <td>${priceDiff || '—'}</td>
        <td>${v ? v.pe_ratio.toFixed(2) : '—'}</td>
        <td>${v ? v.dividend_yield.toFixed(1) + '%' : '—'}</td>
        <td class="${m && m.five_day_return > 0 ? 'positive' : ''}">${m ? (m.five_day_return > 0 ? '+' : '') + m.five_day_return.toFixed(1) + '%' : '—'}</td>
        <td>${m ? m.rsi_14.toFixed(1) : '—'}</td>
        <td>${m ? `<span class="badge ${m.outlook === '樂觀' ? 'badge-success' : m.outlook === '謹慎' ? 'badge-warning' : 'badge-info'}">${m.outlook}</span>` : '—'}</td>
      `;

      row.addEventListener('click', () => {
        currentWeekIndex = wi;
        renderWeekSelectors();
        renderValueTable(week.valueStocks || []);
        renderMomentumTable(week.momentumStocks || []);
        updateHomeStats();
        navigateToPage('value');
      });

      tbody.appendChild(row);
    });

    // 週分隔線
    const sep = document.createElement('tr');
    sep.innerHTML = `<td colspan="9" style="padding:1px;background:var(--color-border);opacity:0.5;"></td>`;
    tbody.appendChild(sep);
  });
}

// ── 表格排序 ──────────────────────────────────────────────────
let currentSort = { key: null, asc: true };

function setupTableSorting() {
  const tbl = document.getElementById('valueTable');
  if (!tbl) return;
  tbl.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => sortValueTable(th.getAttribute('data-sort')));
  });
}

function sortValueTable(key) {
  currentSort.asc = (currentSort.key === key) ? !currentSort.asc : true;
  currentSort.key = key;

  const fieldMap = { pe: 'pe_ratio', distance: 'distance_from_low', dividend: 'dividend_yield' };
  const field = fieldMap[key];
  if (!field) return;

  const sorted = [...currentData().valueStocks].sort((a, b) =>
    currentSort.asc ? a[field] - b[field] : b[field] - a[field]
  );
  renderValueTable(sorted);
}

// ── 初始化 ────────────────────────────────────────────────────
function init() {
  const d = currentData();
  renderValueTable(d.valueStocks);
  renderMomentumTable(d.momentumStocks);
  renderWeekSelectors();
  updateHomeStats();
  setupTableSorting();
  renderHistoryPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
