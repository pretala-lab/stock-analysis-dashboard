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
  renderCrossPage(d);
  renderRiskPage(d);
  renderMarketPage(d);
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

// ── 交叉分析頁 ───────────────────────────────────────────────
function renderCrossPage(data) {
  const container = document.getElementById('cross-dynamic-content');
  if (!container) return;

  const mMap = Object.fromEntries((data.momentumStocks || []).map(s => [s.ticker, s]));

  // 找出同時出現在兩個名單的股票
  const crossTickers = (data.valueStocks || [])
    .filter(v => mMap[v.ticker])
    .sort((a, b) => {
      const ma = mMap[a.ticker], mb = mMap[b.ticker];
      return (mb.five_day_return - ma.five_day_return);
    });

  if (!crossTickers.length) {
    container.innerHTML = `<div class="info-box" style="margin-top:24px;">
      <p style="font-size:14px;">本週無同時符合價值篩選與動能標準的交叉股票。</p>
    </div>`;
    return;
  }

  const cardColors = ['var(--color-success)', 'var(--color-warning)', 'var(--color-primary)'];
  const bgColors   = ['var(--color-bg-3)', 'var(--color-bg-2)', 'var(--color-bg-1)'];

  const cards = crossTickers.map((v, i) => {
    const m = mMap[v.ticker];
    const borderColor = cardColors[i] || cardColors[2];
    const bgColor     = bgColors[i]   || bgColors[2];
    const outlookClass = m.outlook === '樂觀' ? 'badge-success'
                       : m.outlook === '謹慎'  ? 'badge-warning' : 'badge-info';
    const statusClass  = m.status === '超買接近' ? 'badge-warning'
                       : m.status === '超買'      ? 'badge-error' : 'badge-success';
    return `
    <div class="card" style="margin-top:24px; border: 2px solid ${borderColor};">
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
        <div>
          <h2 style="font-size:28px; margin-bottom:8px;"><span class="ticker">${v.ticker}</span> - ${v.name}</h2>
          <p style="color:var(--color-text-secondary);">${v.sector} · 市值 $${v.market_cap.toFixed(1)}B</p>
        </div>
        <div style="text-align:right;">
          <div class="badge" style="background:${borderColor};color:#fff;font-size:13px;padding:6px 14px;">
            ${i === 0 ? '⭐ 首選推薦' : '推薦買入'}
          </div>
        </div>
      </div>
      <div class="grid grid-2" style="margin-top:24px;">
        <div>
          <h3 style="font-size:16px; margin-bottom:12px; color:var(--color-primary);">💎 價值評估</h3>
          <div class="stat-item"><span class="stat-label">本益比 (P/E)</span><span class="stat-value">${v.pe_ratio.toFixed(2)}</span></div>
          <div class="stat-item"><span class="stat-label">現股價</span><span class="stat-value">$${v.current_price.toFixed(2)}</span></div>
          <div class="stat-item"><span class="stat-label">52週低點</span><span class="stat-value">$${v.low_52w.toFixed(2)}</span></div>
          <div class="stat-item"><span class="stat-label">距低點</span><span class="stat-value">${v.distance_from_low.toFixed(1)}%</span></div>
          <div class="stat-item"><span class="stat-label">股息率</span><span class="stat-value positive">${v.dividend_yield.toFixed(2)}%</span></div>
          <div class="stat-item"><span class="stat-label">日均成交量</span><span class="stat-value">${v.daily_volume.toFixed(1)}M 股</span></div>
        </div>
        <div>
          <h3 style="font-size:16px; margin-bottom:12px; color:var(--color-primary);">🚀 動能表現</h3>
          <div class="stat-item"><span class="stat-label">5日漲幅</span><span class="stat-value positive">+${m.five_day_return.toFixed(1)}%</span></div>
          <div class="stat-item"><span class="stat-label">RSI (14日)</span><span class="stat-value">${m.rsi_14.toFixed(1)}</span></div>
          <div class="stat-item"><span class="stat-label">ROC (14日)</span><span class="stat-value ${m.roc_14 >= 0 ? 'positive' : 'negative'}">${m.roc_14 >= 0 ? '+' : ''}${m.roc_14.toFixed(1)}%</span></div>
          <div class="stat-item"><span class="stat-label">ROC (21日)</span><span class="stat-value ${m.roc_21 >= 0 ? 'positive' : 'negative'}">${m.roc_21 >= 0 ? '+' : ''}${m.roc_21.toFixed(1)}%</span></div>
          <div class="stat-item"><span class="stat-label">市場狀態</span><span class="badge ${statusClass}">${m.status}</span></div>
          <div class="stat-item"><span class="stat-label">1-2週展望</span><span class="badge ${outlookClass}">${m.outlook}</span></div>
        </div>
      </div>
      <div style="margin-top:24px; padding:16px; background-color:${bgColor}; border-radius:var(--radius-base);">
        <h3 style="font-size:14px; margin-bottom:8px; font-weight:600;">📈 資料日期：${data.date}</h3>
        <p style="font-size:13px; line-height:1.6;">
          ${v.ticker} 同時符合價值篩選（P/E ${v.pe_ratio.toFixed(2)}，距52週低點 ${v.distance_from_low.toFixed(1)}%）
          與動能標準（5日漲幅 +${m.five_day_return.toFixed(1)}%，RSI ${m.rsi_14.toFixed(1)}）。
          趨勢方向：${m.trend}。風險等級：${v.risk_level}。
        </p>
      </div>
    </div>`;
  }).join('');

  // 對比分析表（前兩支）
  let compTable = '';
  if (crossTickers.length >= 2) {
    const a = crossTickers[0], b = crossTickers[1];
    const ma = mMap[a.ticker], mb = mMap[b.ticker];
    const rows = [
      ['P/E 比', a.pe_ratio.toFixed(2), b.pe_ratio.toFixed(2), a.pe_ratio < b.pe_ratio ? a.ticker : b.ticker, '更低估'],
      ['距52週低點', a.distance_from_low.toFixed(1)+'%', b.distance_from_low.toFixed(1)+'%', a.distance_from_low < b.distance_from_low ? a.ticker : b.ticker, '更接近低點'],
      ['5日漲幅', '+'+ma.five_day_return.toFixed(1)+'%', '+'+mb.five_day_return.toFixed(1)+'%', ma.five_day_return > mb.five_day_return ? a.ticker : b.ticker, '動能更強'],
      ['股息率', a.dividend_yield.toFixed(2)+'%', b.dividend_yield.toFixed(2)+'%', a.dividend_yield > b.dividend_yield ? a.ticker : b.ticker, '收益更高'],
      ['市值', '$'+a.market_cap.toFixed(1)+'B', '$'+b.market_cap.toFixed(1)+'B', a.market_cap > b.market_cap ? a.ticker : b.ticker, '更大型'],
      ['風險等級', a.risk_level, b.risk_level, '', ''],
    ];
    compTable = `
    <div style="margin-top:32px;">
      <h2 style="font-size:20px; margin-bottom:16px; font-weight:600;">🔄 對比分析</h2>
      <div class="table-container">
        <table><thead><tr><th>指標</th><th>${a.ticker}</th><th>${b.ticker}</th><th>優勢</th></tr></thead>
        <tbody>${rows.map(([label, av, bv, winner, desc]) => `
          <tr><td>${label}</td>
              <td class="${label.includes('漲幅') || label.includes('股息') ? 'positive' : ''}">${av}</td>
              <td class="${label.includes('漲幅') || label.includes('股息') ? 'positive' : ''}">${bv}</td>
              <td>${winner ? `<span class="ticker">${winner}</span> ${desc}` : '—'}</td></tr>`
        ).join('')}</tbody></table>
      </div>
    </div>`;
  }

  container.innerHTML = cards + compTable;
}

// ── 風險評估頁 ────────────────────────────────────────────────
function renderRiskPage(data) {
  const container = document.getElementById('risk-dynamic-content');
  if (!container) return;

  const vs = data.valueStocks || [];
  const LOW  = ['低'];
  const MID  = ['中', '中低'];
  const HIGH = ['高', '中高'];

  const lowRisk  = vs.filter(s => LOW.includes(s.risk_level));
  const midRisk  = vs.filter(s => MID.includes(s.risk_level));
  const highRisk = vs.filter(s => HIGH.includes(s.risk_level));

  // 更新概覽計數
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('risk-low-count',  `✅ 低風險 (${lowRisk.length}支)`);
  set('risk-mid-count',  `⚡ 中風險 (${midRisk.length}支)`);
  set('risk-high-count', `⚠️ 高風險 (${highRisk.length}支)`);

  const mMapRisk = Object.fromEntries((data.momentumStocks || []).map(x => [x.ticker, x]));
  const stockCard = (s, bg, large) => {
    const m = mMapRisk[s.ticker];
    const crossBadge = m ? ' <span class="badge badge-success" style="font-size:10px;">★雙優</span>' : '';
    if (large) {
      return `
      <div style="padding:16px; background-color:${bg}; border-radius:var(--radius-base);">
        <h3 style="font-size:16px; margin-bottom:8px;"><span class="ticker">${s.ticker}</span>${crossBadge} - ${s.name}</h3>
        <div class="stat-item"><span class="stat-label">股價</span><span class="stat-value">$${s.current_price.toFixed(2)}</span></div>
        <div class="stat-item"><span class="stat-label">市值</span><span class="stat-value">$${s.market_cap.toFixed(1)}B</span></div>
        <div class="stat-item"><span class="stat-label">股息率</span><span class="stat-value positive">${s.dividend_yield.toFixed(2)}%</span></div>
        <div class="stat-item"><span class="stat-label">P/E</span><span class="stat-value">${s.pe_ratio.toFixed(2)}</span></div>
        <div class="stat-item"><span class="stat-label">產業</span><span class="stat-value">${s.sector}</span></div>
      </div>`;
    }
    return `
    <div style="padding:12px; background-color:${bg}; border-radius:var(--radius-base);">
      <h3 style="font-size:14px; margin-bottom:6px;"><span class="ticker">${s.ticker}</span>${crossBadge}</h3>
      <p style="font-size:12px; color:var(--color-text-secondary);">${s.name} · ${s.sector}</p>
      <div style="margin-top:8px; font-size:12px;">
        <div>股價: $${s.current_price.toFixed(2)}</div>
        <div>市值: $${s.market_cap.toFixed(1)}B</div>
        <div>P/E: ${s.pe_ratio.toFixed(2)} | 股息: ${s.dividend_yield.toFixed(2)}%</div>
      </div>
    </div>`;
  };

  const lowHTML = lowRisk.length ? `
    <div class="card" style="margin-bottom:24px; border-left:4px solid var(--color-success);">
      <h2 style="font-size:20px; margin-bottom:16px; color:var(--color-success);">✅ 低風險股票</h2>
      <p style="margin-bottom:16px; font-size:13px;"><strong>特徵：</strong>超大市值（&gt;$100B）、高股息、防守性行業、低波動</p>
      <div class="grid grid-2">${lowRisk.map(s => stockCard(s, 'var(--color-bg-3)', true)).join('')}</div>
    </div>` : '';

  const midHTML = midRisk.length ? `
    <div class="card" style="margin-bottom:24px; border-left:4px solid var(--color-warning);">
      <h2 style="font-size:20px; margin-bottom:16px; color:var(--color-warning);">⚡ 中風險股票</h2>
      <p style="margin-bottom:16px; font-size:13px;"><strong>特徵：</strong>市值$10B-$500B、適度波動、多元化業務</p>
      <div class="grid grid-3">${midRisk.map(s => stockCard(s, 'var(--color-bg-2)', false)).join('')}</div>
      <p style="margin-top:16px; font-size:13px; line-height:1.6;"><strong>投資建議：</strong>適合平衡型投資者，建議分散配置於不同行業，注意能源板塊的油價風險。</p>
    </div>` : '';

  const highHTML = highRisk.length ? `
    <div class="card" style="border-left:4px solid var(--color-error);">
      <h2 style="font-size:20px; margin-bottom:16px; color:var(--color-error);">⚠️ 高風險股票</h2>
      <p style="margin-bottom:16px; font-size:13px;"><strong>特徵：</strong>小市值或高波動行業、週期性強、無股息或股息低</p>
      <div class="grid grid-2">${highRisk.map(s => stockCard(s, 'var(--color-bg-4)', true)).join('')}</div>
      <div class="warning-box" style="margin-top:16px;">
        <p style="font-size:13px; line-height:1.6;"><strong>⚠️ 重要提醒：</strong>高風險股票波動性大，建議僅以小倉位配置，並設置嚴格止損。不適合風險承受能力低或投資期限短的投資者。</p>
      </div>
    </div>` : '';

  container.innerHTML = lowHTML + midHTML + highHTML;
}

// ── 市場背景頁 ────────────────────────────────────────────────
function renderMarketPage(data) {
  const container = document.getElementById('market-dynamic-content');
  const subtitle  = document.getElementById('market-subtitle');
  if (!container) return;

  const mc  = data.marketContext;
  const vs  = data.valueStocks   || [];
  const ms  = data.momentumStocks || [];
  const mMap = Object.fromEntries(ms.map(s => [s.ticker, s]));

  // 更新副標題
  if (subtitle) subtitle.textContent = `${data.date} 美股市場環境與投資機會`;

  // ── 若無市場背景資料（舊版快照）──────────────────────────
  if (!mc || !mc.indices || Object.keys(mc.indices).length === 0) {
    // 仍可從股票資料推導一些觀察
    container.innerHTML = buildMarketFromStocksOnly(data, vs, ms, mMap);
    return;
  }

  // ── 大盤指數 ───────────────────────────────────────────────
  const idxOrder = ['SP500', 'NASDAQ', 'DJI', 'VIX', 'TNX'];
  const idxCards = idxOrder.map(key => {
    const idx = mc.indices[key];
    if (!idx) return '';
    const isVix = key === 'VIX';
    const isTnx = key === 'TNX';
    const chg   = idx.weekly_change;
    const up    = chg >= 0;
    // VIX：升是壞事；TNX：中性；其他：升是好事
    const goodUp = !isVix;
    const colorClass = (goodUp ? up : !up) ? 'positive' : 'negative';
    const priceStr = isTnx ? `${idx.price.toFixed(2)}%` : idx.price.toLocaleString();
    return `
    <div class="card" style="text-align:center;">
      <div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:4px;">${idx.name}</div>
      <div style="font-size:20px; font-weight:600;">${priceStr}</div>
      <div class="${colorClass}" style="font-size:13px; margin-top:4px;">${up ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}% 週</div>
    </div>`;
  }).join('');

  // ── VIX 風險解讀 ────────────────────────────────────────────
  const vix = mc.indices['VIX']?.price || 0;
  const vixLevel = vix < 15 ? { label: '低度恐慌', color: 'var(--color-success)', bg: 'var(--color-bg-3)', desc: '市場情緒樂觀，波動性低' }
                 : vix < 25 ? { label: '中度不確定', color: 'var(--color-warning)', bg: 'var(--color-bg-2)', desc: '市場存在一定不確定性，正常範圍' }
                 :             { label: '高度恐慌', color: 'var(--color-error)', bg: 'var(--color-bg-4)', desc: '市場高度恐慌，波動劇烈，需謹慎' };

  // ── 板塊週漲跌排行 ─────────────────────────────────────────
  const sectors = (mc.sectors || []).slice(0, 10);
  const maxAbs  = Math.max(...sectors.map(s => Math.abs(s.weekly_change)), 0.1);
  const sectorRows = sectors.map(s => {
    const pct   = s.weekly_change;
    const width = Math.abs(pct) / maxAbs * 100;
    const up    = pct >= 0;
    return `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <span style="width:80px; font-size:12px; color:var(--color-text-secondary);">${s.name}</span>
      <span style="font-size:11px; font-weight:600; width:40px; text-align:right; color:var(--color-text-secondary);">${s.etf}</span>
      <div style="flex:1; background:var(--color-secondary); border-radius:4px; height:10px; overflow:hidden;">
        <div style="width:${width}%; height:100%; background:${up ? 'var(--color-success)' : 'var(--color-error)'}; border-radius:4px;"></div>
      </div>
      <span class="${up ? 'positive' : 'negative'}" style="font-size:13px; font-weight:600; width:56px; text-align:right;">${up ? '+' : ''}${pct.toFixed(2)}%</span>
    </div>`;
  }).join('');

  // ── 從股票資料推導機會與風險 ──────────────────────────────
  const { opps, risks } = deriveOppsRisks(vs, ms, mMap);

  container.innerHTML = `
    <!-- 大盤指數 -->
    <div class="grid grid-4" style="margin-bottom:32px; gap:16px;">
      ${idxCards}
    </div>

    <!-- VIX 解讀 -->
    <div style="padding:16px; background:${vixLevel.bg}; border-left:4px solid ${vixLevel.color}; border-radius:var(--radius-base); margin-bottom:32px;">
      <strong>恐慌指數 VIX ${vix.toFixed(1)} — ${vixLevel.label}</strong>
      <span style="font-size:13px; color:var(--color-text-secondary); margin-left:8px;">${vixLevel.desc}</span>
    </div>

    <!-- 板塊表現 + 本週股票觀察 -->
    <div class="grid grid-2" style="margin-bottom:32px;">
      <div class="card">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-primary);">🏭 板塊週漲跌排行</h3>
        ${sectorRows || '<p style="color:var(--color-text-secondary);font-size:13px;">板塊資料載入中…</p>'}
      </div>
      <div class="card">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-primary);">📊 本週股票觀察</h3>
        ${buildStockObservations(vs, ms, mMap)}
      </div>
    </div>

    <!-- 機會與風險 -->
    <div class="grid grid-2">
      <div class="card" style="border-left:4px solid var(--color-success);">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-success);">✅ 投資機會</h3>
        ${opps}
      </div>
      <div class="card" style="border-left:4px solid var(--color-error);">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-error);">⚠️ 風險因素</h3>
        ${risks}
      </div>
    </div>`;
}

// 從股票資料推導機會與風險
function deriveOppsRisks(vs, ms, mMap) {
  const crossStocks   = vs.filter(v => mMap[v.ticker]);
  const lowPE         = vs.filter(v => v.pe_ratio > 0 && v.pe_ratio <= 10);
  const highDiv       = vs.filter(v => v.dividend_yield >= 4);
  const overbought    = ms.filter(m => m.rsi_14 >= 70);
  const oversold      = ms.filter(m => m.rsi_14 <= 30);
  const bullish       = ms.filter(m => m.outlook === '樂觀');
  const nearLow       = vs.filter(v => v.distance_from_low <= 10);

  const oppItem = (title, desc) =>
    `<div style="padding:12px; background:var(--color-bg-3); border-radius:var(--radius-base); margin-bottom:10px;">
      <strong>${title}</strong><br><span style="font-size:12px;">${desc}</span></div>`;
  const riskItem = (title, desc) =>
    `<div style="padding:12px; background:var(--color-bg-4); border-radius:var(--radius-base); margin-bottom:10px;">
      <strong>${title}</strong><br><span style="font-size:12px;">${desc}</span></div>`;

  const opps = [
    crossStocks.length  ? oppItem('雙重機會', `${crossStocks.map(s=>s.ticker).join('、')} 同時符合價值與動能標準`) : '',
    lowPE.length        ? oppItem('低估值機會', `${lowPE.length} 支股票 P/E ≤ 10：${lowPE.map(s=>s.ticker).join('、')}`) : '',
    highDiv.length      ? oppItem('高股息收益', `${highDiv.map(s=>`${s.ticker} ${s.dividend_yield.toFixed(1)}%`).join('、')}`) : '',
    nearLow.length      ? oppItem('接近52週低點', `${nearLow.map(s=>s.ticker).join('、')} 距低點 ≤10%，進場點佳`) : '',
    bullish.length      ? oppItem('動能樂觀', `${bullish.length} 支動能股展望樂觀，技術面支持上漲`) : '',
    oversold.length     ? oppItem('超賣反彈機會', `${oversold.map(m=>m.ticker).join('、')} RSI ≤ 30，可能出現反彈`) : '',
  ].filter(Boolean).join('') || oppItem('本週無明顯機會', '建議觀望或持倉等待');

  const risks = [
    overbought.length   ? riskItem('超買風險', `${overbought.map(m=>`${m.ticker} RSI ${m.rsi_14.toFixed(0)}`).join('、')} 短期回調壓力`) : '',
    riskItem('行業風險', '能源股受油價波動影響，通訊業面臨競爭壓力'),
    riskItem('宏觀風險', '利率政策、地緣政治、經濟數據均可能引發波動'),
  ].filter(Boolean).join('');

  return { opps, risks };
}

// 本週股票觀察（無大盤資料時也可用）
function buildStockObservations(vs, ms, mMap) {
  const items = [];
  const avgPE  = vs.length ? vs.reduce((s,x) => s + x.pe_ratio, 0) / vs.length : 0;
  const avgRSI = ms.length ? ms.reduce((s,x) => s + x.rsi_14, 0) / ms.length : 0;
  const cross  = vs.filter(v => mMap[v.ticker]);
  const bull   = ms.filter(m => m.outlook === '樂觀');
  const ob     = ms.filter(m => m.rsi_14 >= 70);

  if (avgPE   > 0) items.push(`平均 P/E：<strong>${avgPE.toFixed(1)}</strong>`);
  if (avgRSI  > 0) items.push(`平均 RSI：<strong>${avgRSI.toFixed(1)}</strong>`);
  if (cross.length) items.push(`雙重機會：<strong class="ticker">${cross.map(s=>s.ticker).join('、')}</strong>`);
  if (bull.length)  items.push(`樂觀展望：<strong>${bull.length} 支</strong> (${bull.map(m=>m.ticker).join('、')})`);
  if (ob.length)    items.push(`超買股票：<strong>${ob.map(m=>`${m.ticker}(${m.rsi_14.toFixed(0)})`).join('、')}</strong>`);

  return items.map(i =>
    `<div class="stat-item"><span style="font-size:13px;">${i}</span></div>`
  ).join('') || '<p style="color:var(--color-text-secondary);font-size:13px;">無資料</p>';
}

// 無市場背景資料時的降級顯示（舊版快照用）
function buildMarketFromStocksOnly(data, vs, ms, mMap) {
  const { opps, risks } = deriveOppsRisks(vs, ms, mMap);
  return `
    <div class="info-box" style="margin-bottom:24px;">
      <p style="font-size:13px;">此週（${data.date}）無大盤指數資料（初始版本），以下內容由股票資料推導。</p>
    </div>
    <div class="grid grid-2" style="margin-bottom:32px;">
      <div class="card">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-primary);">📊 本週股票觀察</h3>
        ${buildStockObservations(vs, ms, mMap)}
      </div>
      <div class="card">
        <h3 style="font-size:18px; margin-bottom:12px; color:var(--color-primary);">💡 說明</h3>
        <p style="font-size:13px; line-height:1.6;">此週快照未包含大盤市場資料。從下次更新起，系統將自動抓取 S&amp;P 500、那斯達克、VIX、各板塊 ETF 等市場數據。</p>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card" style="border-left:4px solid var(--color-success);">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-success);">✅ 投資機會</h3>${opps}
      </div>
      <div class="card" style="border-left:4px solid var(--color-error);">
        <h3 style="font-size:18px; margin-bottom:16px; color:var(--color-error);">⚠️ 風險因素</h3>${risks}
      </div>
    </div>`;
}

// ── 初始化 ────────────────────────────────────────────────────
function init() {
  const d = currentData();
  renderValueTable(d.valueStocks);
  renderMomentumTable(d.momentumStocks);
  renderCrossPage(d);
  renderRiskPage(d);
  renderMarketPage(d);
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
