/* ============================================================
   Meridian 全球运营指挥中心 · ops.js
   动效规格见 MOTION.md（motion-interaction-skill）
   零依赖；渐进增强：无 JS / reduced-motion 时内容全部可见且为终态
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !reduceMQ.matches;

  /* ---------- 1. 主题（笑脸开关） ---------- */
  const themeToggle = $('#themeToggle');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(t === 'dark'));
      themeToggle.classList.toggle('is-flipped', t === 'dark');
    }
    try { localStorage.setItem('ops-theme', t); } catch (e) { /* 隐私模式忽略 */ }
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- 2. 实时时钟 ---------- */
  const clock = $('#clock');
  const pad = (n) => String(n).padStart(2, '0');
  function tickClock() {
    if (!clock) return;
    const d = new Date();
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tickClock();
  setInterval(tickClock, 1000);
  const footSync = $('#footSync');
  if (footSync) { const d = new Date(); footSync.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  /* ---------- 3. Reveal（渐进增强，skill §13） ---------- */
  let revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  function setupReveals() {
    const items = $$('.reveal');
    if (!motionOK() || !revealIO) return;
    root.classList.add('reveal-ready');
    // 同组错峰 40ms，序列总长 ≤ 500ms
    const groups = new Map();
    for (const el of items) {
      const p = el.parentElement;
      const i = groups.get(p) || 0;
      el.style.setProperty('--rd', `${Math.min(i, 8) * 40}ms`);
      groups.set(p, i + 1);
    }
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('in');
      else revealIO.observe(el);
    }
  }

  /* 进入视口一次即执行 */
  function onInView(el, fn, threshold = 0.25) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        fn();
      }
    }, { threshold });
    io.observe(el);
  }

  /* ---------- 4. Count-up（skill §13；reduced-motion 直接终值） ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (!motionOK() || isNaN(to)) { el.textContent = isNaN(to) ? '—' : to.toFixed(dec); return; }
    const dur = 800, t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    el.textContent = (0).toFixed(dec); // 从 0 起滚：静态 HTML 中已是终值，无 JS 时可读
    const frame = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = (to * ease(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  $$('[data-count]').forEach((el) => {
    onInView(el.closest('.reveal') || el, () => countUp(el));
  });

  /* ---------- 5. 环形图描边绘制 ---------- */
  const donut = $('#donut');
  if (donut) {
    const segs = $$('.donut-seg', donut);
    segs.forEach((s, i) => s.style.setProperty('--rd', `${i * 120}ms`));
    onInView(donut.closest('.reveal') || donut, () => {
      if (!motionOK()) return;
      segs.forEach((s) => {
        const len = parseFloat(s.style.getPropertyValue('--len'));
        const pos = parseFloat(s.style.getPropertyValue('--pos'));
        s.style.strokeDashoffset = String(len - pos);
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        segs.forEach((s) => {
          s.style.strokeDashoffset = String(-parseFloat(s.style.getPropertyValue('--pos')));
        });
      }));
    }, 0.3);
  }

  /* ---------- 6. 营收趋势图 ---------- */
  const TREND = {
    year: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      ymax: 2.4, yTicks: ['0', '0.6', '1.2', '1.8', '2.4'],
      actual: [1.42, 1.36, 1.58, 1.62, 1.55, 1.71, 1.68, 1.84, 1.79, 1.93, 1.88, 2.08],
      target: [1.55, 1.58, 1.60, 1.62, 1.65, 1.67, 1.70, 1.72, 1.75, 1.78, 1.80, 1.83]
    },
    quarter: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      ymax: 8, yTicks: ['0', '2', '4', '6', '8'],
      actual: [4.36, 4.88, 5.31, 5.89],
      target: [4.73, 4.96, 5.14, 5.42]
    },
    month: {
      labels: Array.from({ length: 30 }, (_, i) => (i === 29 ? '30' : (i % 6 === 0 ? String(i + 1) : ''))),
      ymax: 1, yTicks: ['0', '0.25', '0.5', '0.75', '1.0'],
      actual: [0.52, 0.48, 0.55, 0.61, 0.58, 0.53, 0.49, 0.56, 0.62, 0.66, 0.60, 0.57, 0.63, 0.68, 0.71, 0.65, 0.59, 0.62, 0.67, 0.72, 0.69, 0.64, 0.70, 0.75, 0.78, 0.73, 0.71, 0.76, 0.80, 0.83],
      target: Array.from({ length: 30 }, (_, i) => +(0.58 + 0.0069 * i).toFixed(2))
    }
  };

  const trendSvg = $('#trendChart');
  const trendLine = $('#trendLine');
  const trendTarget = $('#trendTarget');
  const trendArea = $('#trendArea');
  const yLabels = $('#yLabels');
  const xLabels = $('#xLabels');
  const trendReadout = $('#trendReadout');
  const crosshair = $('#trendCrosshair');
  const chLine = $('#chLine');
  const chDot = $('#chDot');
  let trendRange = 'year';

  const trendX = (i, n) => 40 + i * (660 / (n - 1));
  const trendY = (v, ymax) => 260 - (v / ymax) * 220;
  const buildLine = (vals, ymax) => vals.map((v, i) => `${i ? 'L' : 'M'}${trendX(i, vals.length).toFixed(1)} ${trendY(v, ymax).toFixed(1)}`).join(' ');

  function renderTrend(range, animate = true) {
    trendRange = range;
    const d = TREND[range];
    const line = buildLine(d.actual, d.ymax);
    trendLine.setAttribute('d', line);
    trendTarget.setAttribute('d', buildLine(d.target, d.ymax));
    trendArea.setAttribute('d', `${line} L700 260 L40 260 Z`);
    // 轴标签
    yLabels.innerHTML = d.yTicks.map((t, i) => `<text x="32" y="${264 - i * 67.5}" text-anchor="end">${t}</text>`).join('');
    xLabels.innerHTML = d.labels.map((t, i) => (t ? `<text x="${trendX(i, d.labels.length).toFixed(1)}" y="284">${t}</text>` : '')).join('');
    trendReadout.textContent = `${d.labels.find(Boolean) || '1'} · 实际 ${d.actual[0]} 亿 · 目标 ${d.target[0]} 亿`;
    if (!animate || !motionOK()) {
      trendLine.style.strokeDasharray = 'none'; trendLine.style.strokeDashoffset = '0';
      trendTarget.style.strokeDasharray = 'none'; trendTarget.style.strokeDashoffset = '0';
      trendArea.style.opacity = '1';
      return;
    }
    // 快速重绘（切换范围时 400ms）
    const ll = trendLine.getTotalLength(), tl = trendTarget.getTotalLength();
    trendLine.style.transition = 'none'; trendTarget.style.transition = 'none'; trendArea.style.transition = 'none';
    trendLine.style.strokeDasharray = ll; trendLine.style.strokeDashoffset = ll;
    trendTarget.style.strokeDasharray = tl; trendTarget.style.strokeDashoffset = tl;
    trendArea.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      trendLine.style.transition = 'stroke-dashoffset 400ms var(--ease-enter)'; trendLine.style.strokeDashoffset = '0';
      trendTarget.style.transition = 'stroke-dashoffset 400ms var(--ease-enter) 100ms'; trendTarget.style.strokeDashoffset = '0';
      trendArea.style.transition = 'opacity 350ms var(--ease-enter) 250ms'; trendArea.style.opacity = '1';
    }));
  }

  // 首次进入：完整绘制 1.2s
  onInView(trendSvg, () => {
    if (!motionOK()) return;
    const ll = trendLine.getTotalLength(), tl = trendTarget.getTotalLength();
    trendLine.style.strokeDasharray = ll; trendLine.style.strokeDashoffset = ll;
    trendTarget.style.strokeDasharray = tl; trendTarget.style.strokeDashoffset = tl;
    trendArea.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      trendLine.style.transition = 'stroke-dashoffset 1200ms var(--ease-enter)'; trendLine.style.strokeDashoffset = '0';
      trendTarget.style.transition = 'stroke-dashoffset 1000ms var(--ease-enter) 200ms'; trendTarget.style.strokeDashoffset = '0';
      trendArea.style.transition = 'opacity 600ms var(--ease-enter) 500ms'; trendArea.style.opacity = '1';
    }));
  }, 0.2);

  // 分段控件
  const segBtns = $$('.seg-btn');
  const segIndicator = $('#segIndicator');
  function moveIndicator(btn) {
    if (!segIndicator || !btn) return;
    segIndicator.style.width = `${btn.offsetWidth}px`;
    segIndicator.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
  }
  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      segBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      moveIndicator(btn);
      renderTrend(btn.dataset.range);
    });
  });
  const activeSeg = $('.seg-btn.is-active') || segBtns[0];
  requestAnimationFrame(() => moveIndicator(activeSeg));
  addEventListener('resize', () => moveIndicator($('.seg-btn.is-active')));

  // 十字准线（pointer: fine）
  if (trendSvg && matchMedia('(pointer: fine)').matches) {
    trendSvg.addEventListener('pointermove', (e) => {
      if (!motionOK() || e.pointerType !== 'mouse') return;
      const r = trendSvg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 720;
      const d = TREND[trendRange];
      const i = Math.round((x - 40) / (660 / (d.actual.length - 1)));
      if (i < 0 || i >= d.actual.length) return;
      chLine.setAttribute('x1', trendX(i, d.actual.length).toFixed(1));
      chLine.setAttribute('x2', trendX(i, d.actual.length).toFixed(1));
      chDot.setAttribute('cx', trendX(i, d.actual.length).toFixed(1));
      chDot.setAttribute('cy', trendY(d.actual[i], d.ymax).toFixed(1));
      crosshair.hidden = false;
      trendReadout.textContent = `${d.labels[i] || `${i + 1}日`} · 实际 ${d.actual[i]} 亿 · 目标 ${d.target[i]} 亿`;
    });
    trendSvg.addEventListener('pointerleave', () => { crosshair.hidden = true; });
  }

  /* ---------- 7. 签名：滚动即数据流（巨型字母） ---------- */
  const sigSection = $('#signature');
  const letterTrack = $('#letterTrack');
  if (sigSection && letterTrack) {
    const letterSet = $('.letter-set');
    let setW = 0, visible = false, ticking = false;

    const measure = () => { setW = letterSet.offsetWidth; };

    function update() {
      ticking = false;
      const r = sigSection.getBoundingClientRect();
      const range = r.height - innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      letterTrack.style.transform = `translateX(${(-p * setW).toFixed(1)}px)`;
    }

    if (motionOK()) {
      measure();
      addEventListener('scroll', () => {
        if (ticking || !visible) return;
        ticking = true;
        requestAnimationFrame(update);
      }, { passive: true });
      addEventListener('resize', () => { measure(); update(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible) update();
        }, { threshold: 0 }).observe(sigSection);
      } else {
        visible = true;
      }
      update();
    } else {
      // reduced-motion：静态居中排版
      measure();
      const vw = sigSection.querySelector('.letter-window').clientWidth;
      letterTrack.style.transform = `translateX(${setW <= vw ? (vw - setW) / 2 : -(setW - vw) / 2}px)`;
    }
  }

  /* ---------- 8. 区域下钻 → 联动图表与明细表 ---------- */
  const drillState = { region: null };
  const regionRows = $$('.region-row');
  const drillStateText = $('#drillState');
  const drillClear = $('#drillClear');
  const invNote = $('#invNote');

  function applyDrill() {
    regionRows.forEach((r) => r.classList.toggle('is-drilled', r.dataset.region === drillState.region));
    if (drillStateText) drillStateText.textContent = drillState.region || '全部区域';
    if (drillClear) drillClear.hidden = !drillState.region;
    $$('#regionChips .chip').forEach((c) => {
      c.classList.toggle('is-active', c.dataset.filter === (drillState.region || 'all'));
    });
    $$('#invList .inv-row').forEach((ir) => {
      ir.classList.toggle('is-dimmed', !!drillState.region && ir.dataset.region !== drillState.region);
    });
    if (invNote) invNote.textContent = drillState.region ? `当前仅高亮：${drillState.region}` : '下钻区域后，此图仅显示该区域';
    table.filter = drillState.region || 'all';
    table.page = 1;
    renderTable();
  }

  regionRows.forEach((row) => {
    row.addEventListener('click', () => {
      drillState.region = drillState.region === row.dataset.region ? null : row.dataset.region;
      applyDrill();
    });
  });
  if (drillClear) drillClear.addEventListener('click', () => { drillState.region = null; applyDrill(); });

  /* ---------- 9. 明细数据表：排序 / 搜索 / 筛选 / 分页 / FLIP ---------- */
  const tbody = $('#tableBody');
  const table = {
    rows: tbody ? $$('tr', tbody) : [],
    sortKey: 'updated',
    sortDir: 'desc',
    filter: 'all',
    query: '',
    page: 1,
    perPage: 8
  };
  const tableEmpty = $('#tableEmpty');
  const tableCount = $('#tableCount');
  const pagerPages = $('#pagerPages');
  const prevPage = $('#prevPage');
  const nextPage = $('#nextPage');

  function currentRows() {
    let list = table.rows.slice();
    if (table.filter !== 'all') list = list.filter((r) => r.dataset.region === table.filter);
    const q = table.query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        `${r.dataset.id} ${r.dataset.region} ${r.dataset.category} ${r.dataset.customer}`.toLowerCase().includes(q));
    }
    if (table.sortKey) {
      const k = table.sortKey, dir = table.sortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const va = a.dataset[k], vb = b.dataset[k];
        const na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
        return String(va).localeCompare(String(vb), 'zh-Hans-CN') * dir;
      });
    }
    return list;
  }

  function renderPager(pages) {
    if (!pagerPages) return;
    let html = '';
    const win = [];
    for (let i = 1; i <= pages; i++) {
      if (pages <= 7 || i === 1 || i === pages || Math.abs(i - table.page) <= 1) win.push(i);
    }
    let last = 0;
    for (const i of win) {
      if (last && i - last > 1) html += '<span class="pager-gap" aria-hidden="true">…</span>';
      html += `<button class="pager-page${i === table.page ? ' is-active' : ''}" type="button" data-page="${i}" aria-label="第 ${i} 页"${i === table.page ? ' aria-current="page"' : ''}>${i}</button>`;
      last = i;
    }
    pagerPages.innerHTML = html;
    $$('.pager-page', pagerPages).forEach((b) => {
      b.addEventListener('click', () => { table.page = +b.dataset.page; renderTable(); });
    });
    if (prevPage) prevPage.disabled = table.page <= 1;
    if (nextPage) nextPage.disabled = table.page >= pages;
  }

  function renderTable(flip = true) {
    if (!tbody) return;
    const list = currentRows();
    const pages = Math.max(1, Math.ceil(list.length / table.perPage));
    table.page = Math.min(table.page, pages);
    const start = (table.page - 1) * table.perPage;
    const visible = new Set(list.slice(start, start + table.perPage));

    // FLIP：先量后写（skill §13）
    const first = new Map();
    if (flip && motionOK()) {
      for (const r of table.rows) if (!r.hidden) first.set(r, r.getBoundingClientRect());
    }

    table.rows.forEach((r) => { r.hidden = !visible.has(r); });
    const frag = document.createDocumentFragment();
    list.forEach((r) => frag.appendChild(r));
    table.rows.filter((r) => !list.includes(r)).forEach((r) => frag.appendChild(r));
    tbody.appendChild(frag);

    if (flip && motionOK()) {
      for (const [el, r0] of first) {
        if (el.hidden) continue;
        const r1 = el.getBoundingClientRect();
        const dx = r0.left - r1.left, dy = r0.top - r1.top;
        if (!dx && !dy) continue;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
        );
      }
    }

    if (tableEmpty) tableEmpty.hidden = list.length > 0;
    if (tableCount) {
      tableCount.textContent = `共 ${list.length} 单 · 第 ${table.page} / ${pages} 页`;
    }
    renderPager(pages);

    // 表头排序态
    $$('#dataTable th.sortable').forEach((th) => {
      const on = th.dataset.sort === table.sortKey;
      th.classList.toggle('is-sorted', on);
      th.classList.toggle('is-desc', on && table.sortDir === 'desc');
      if (on) th.setAttribute('aria-sort', table.sortDir === 'asc' ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });
  }

  $$('#dataTable th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (table.sortKey === k) table.sortDir = table.sortDir === 'asc' ? 'desc' : 'asc';
      else { table.sortKey = k; table.sortDir = th.dataset.type === 'num' ? 'desc' : 'asc'; }
      table.page = 1;
      renderTable();
    });
  });

  const search = $('#tableSearch');
  if (search) {
    search.addEventListener('input', () => {
      table.query = search.value;
      table.page = 1;
      renderTable();
    });
  }

  $$('#regionChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      drillState.region = chip.dataset.filter === 'all' ? null : chip.dataset.filter;
      applyDrill();
    });
  });

  if (prevPage) prevPage.addEventListener('click', () => { table.page = Math.max(1, table.page - 1); renderTable(); });
  if (nextPage) nextPage.addEventListener('click', () => { table.page = table.page + 1; renderTable(); });

  renderTable(false);

  /* ---------- 10. 贸易网络：点阵 + 枢纽下钻 ---------- */
  const netDots = $('#netDots');
  if (netDots && !netDots.childElementCount) {
    const cx = 480, cy = 230, r = 168;
    let html = '';
    const step = 6.2, cols = Math.round((2 * r) / step);
    for (let row = 0; row < cols; row++) {
      for (let col = 0; col < cols; col++) {
        const x = cx - r + (col + 0.5) * ((2 * r) / cols);
        const y = cy - r + (row + 0.5) * ((2 * r) / cols);
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d <= r - 4) {
          // 径向明暗：中心实、边缘虚，读作球体
          const op = Math.max(0.1, 0.95 - 0.85 * Math.pow(d / r, 1.3)).toFixed(2);
          html += `<circle class="net-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" opacity="${op}"/>`;
        }
      }
    }
    netDots.innerHTML = html;
  }

  // 干线流动光点（SMIL animateMotion；reduced-motion 不加，静态弧线已表达货运方向）
  if (motionOK()) {
    const routeGroup = $('.routes');
    if (routeGroup) {
      $$('.route', routeGroup).forEach((rt, i) => {
        const d = rt.getAttribute('d');
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('class', 'route-pulse');
        pulse.setAttribute('r', '3');
        const motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        motion.setAttribute('dur', `${2.6 + (i % 4) * 0.5}s`);
        motion.setAttribute('repeatCount', 'indefinite');
        motion.setAttribute('path', d);
        motion.setAttribute('begin', `${(i % 5) * 0.4}s`);
        pulse.appendChild(motion);
        routeGroup.appendChild(pulse);
      });
    }
  }

  const HUB_INFO = {
    上海: { value: '12.4 亿美元' },
    深圳: { value: '8.6 亿美元' },
    新加坡: { value: '10.2 亿美元' },
    迪拜: { value: '6.8 亿美元' },
    纽约: { value: '7.4 亿美元' },
    洛杉矶: { value: '5.1 亿美元' }
  };
  const netTitle = $('#netSideTitle');
  const netHubs = $('#netHubs');
  const netRoutes = $('#netRoutes');
  const netValue = $('#netValue');
  const netDesc = $('#netSideDesc');
  const routes = $$('.route');
  const hubs = $$('.hub');
  let activeHub = null;

  function setHub(hub) {
    activeHub = hub;
    hubs.forEach((h) => h.classList.toggle('is-active', hub && h.dataset.hub === hub));
    routes.forEach((rt) => {
      const on = !!hub && rt.dataset.route.includes(hub);
      rt.classList.toggle('is-on', on);
      const beam = rt.previousElementSibling;
      if (beam && beam.classList.contains('route-beam')) beam.classList.toggle('is-on', on);
    });
    if (hub) {
      const hubRoutes = routes.filter((rt) => rt.dataset.route.includes(hub));
      netTitle.textContent = hub;
      netHubs.textContent = '1';
      netRoutes.textContent = String(hubRoutes.length);
      netValue.textContent = (HUB_INFO[hub] && HUB_INFO[hub].value) || '—';
      netDesc.textContent = `该枢纽连接 ${hubRoutes.length} 条干线；黑色高亮为其在途链路。`;
    } else {
      netTitle.textContent = '全部枢纽';
      netHubs.textContent = '14';
      netRoutes.textContent = '10';
      netValue.textContent = '58.6 亿美元';
      netDesc.textContent = '点击地图上的枢纽下钻；再次点击取消。干线虚线的流动方向即货运方向。';
    }
  }
  hubs.forEach((h) => {
    h.addEventListener('click', () => {
      setHub(activeHub === h.dataset.hub ? null : h.dataset.hub);
    });
  });

  /* ---------- 11. 实时告警轮播（hover/焦点/离屏暂停） ---------- */
  const feed = $('#alertFeed');
  if (feed) {
    const items = $$('.alert-item', feed);
    let ai = 0, timer = null;
    const rotate = () => {
      items.forEach((it, i) => it.classList.toggle('is-current', i === ai));
      ai = (ai + 1) % items.length;
    };
    const start = () => { if (!timer) timer = setInterval(rotate, 4000); };
    const stop = () => { clearInterval(timer); timer = null; };
    if (motionOK() && items.length) {
      rotate();
      start();
      feed.addEventListener('pointerenter', stop);
      feed.addEventListener('pointerleave', start);
      feed.addEventListener('focusin', stop);
      feed.addEventListener('focusout', start);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) start(); else stop();
        }, { threshold: 0 }).observe(feed);
      }
    }
  }

  /* ---------- 12. 磁吸 CTA（skill §5/§13，pointer: fine） ---------- */
  const mag = $('.btn-magnet');
  if (mag && matchMedia('(pointer: fine)').matches && motionOK()) {
    mag.addEventListener('pointermove', (e) => {
      const r = mag.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.2;
      const y = (e.clientY - r.top - r.height / 2) * 0.2;
      mag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    mag.addEventListener('pointerleave', () => { mag.style.transform = ''; mag.classList.remove('is-press'); });
    mag.addEventListener('pointerdown', () => mag.classList.add('is-press'));
    mag.addEventListener('pointerup', () => mag.classList.remove('is-press'));
  }

  /* ---------- 13. 滚动进度 + scrollspy ---------- */
  const progressBar = $('#scrollProgressBar');
  if (progressBar) {
    let pt = false;
    addEventListener('scroll', () => {
      if (pt) return;
      pt = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
        progressBar.style.width = `${(p * 100).toFixed(2)}%`;
        pt = false;
      });
    }, { passive: true });
  }

  const navLinks = $$('.site-nav a[data-spy]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        navLinks.forEach((a) => {
          const on = a.dataset.spy === e.target.id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    navLinks.forEach((a) => {
      const sec = document.getElementById(a.dataset.spy);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- init ---------- */
  setupReveals();
  addEventListener('beforeprint', () => root.classList.remove('reveal-ready'));

})();
