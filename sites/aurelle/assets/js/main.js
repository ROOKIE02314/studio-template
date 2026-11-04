/* AURELLE — 交互脚本
   公告轮换 / 顶栏状态 / 抽屉 / 搜索 / 快速查看 / 购物袋 / 入场动效 */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── 图标（构建时内联的 AU_ICONS 映射） ── */
  function icon(name, cls) {
    var raw = window.AU_ICONS && window.AU_ICONS[name];
    if (!raw) return '';
    var svg = raw.replace('<svg ', '<svg class="' + (cls || 'ico') + '" ');
    return svg;
  }

  /* ── 给克隆/注入的 SVG 的 id 加前缀，避免同页多实例撞 ID ── */
  function prefixIds(svgEl, pfx) {
    var ids = [];
    $$('[id]', svgEl).forEach(function (n) { ids.push(n.id); });
    ids.forEach(function (id) {
      $$('#' + CSS.escape(id), svgEl.ownerDocument).forEach(function (n) {
        if (svgEl.contains(n)) n.id = pfx + id;
      });
    });
    svgEl.querySelectorAll('*').forEach(function (n) {
      ['clip-path', 'fill', 'stroke', 'mask', 'filter', 'marker-start', 'marker-mid', 'marker-end'].forEach(function (attr) {
        var v = n.getAttribute(attr);
        if (v && v.indexOf('url(#') === 0) {
          var id = v.slice(5, -1);
          if (ids.indexOf(id) !== -1) n.setAttribute(attr, 'url(#' + pfx + id + ')');
        }
      });
      var href = n.getAttribute('href') || n.getAttribute('xlink:href');
      if (href && href.indexOf('#') === 0) {
        var hid = href.slice(1);
        if (ids.indexOf(hid) !== -1) n.setAttribute('href', '#' + pfx + hid);
      }
    });
    return svgEl;
  }

  /* ── 公告栏轮换 ── */
  var announceItems = $$('.announce-item');
  var ai = 0;
  if (announceItems.length > 1) {
    setInterval(function () {
      announceItems[ai].classList.remove('on');
      ai = (ai + 1) % announceItems.length;
      announceItems[ai].classList.add('on');
    }, 4000);
  }

  /* ── 顶栏滚动态 ── */
  var header = $('#header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 浮层管理（互斥开关） ── */
  var overlay = $('#overlay');
  var openLayers = [];
  function lockBody(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  function openLayer(el, cls) {
    openLayers.slice().forEach(function (other) {
      if (other !== el) closeLayer(other);
    });
    el.classList.add(cls || 'open');
    if (openLayers.indexOf(el) === -1) openLayers.push(el);
    overlay.classList.add('open');
    lockBody(true);
  }
  function closeLayer(el, cls) {
    el.classList.remove(cls || 'open');
    openLayers = openLayers.filter(function (x) { return x !== el; });
    if (!openLayers.length) {
      overlay.classList.remove('open');
      lockBody(false);
    }
  }
  overlay.addEventListener('click', function () {
    openLayers.slice().forEach(function (el) { closeLayer(el); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openLayers.length) {
      openLayers.slice().forEach(function (el) { closeLayer(el); });
    }
  });

  var menuDrawer = $('#menu-drawer'), cartDrawer = $('#cart-drawer'), searchPop = $('#search-pop'), quickview = $('#quickview');
  $('#menu-open').addEventListener('click', function () { openLayer(menuDrawer); });
  $('#menu-close').addEventListener('click', function () { closeLayer(menuDrawer); });
  $('#cart-open').addEventListener('click', function () { renderCart(); openLayer(cartDrawer); });
  $('#cart-close').addEventListener('click', function () { closeLayer(cartDrawer); });
  $('#search-open').addEventListener('click', function () { openLayer(searchPop); $('#search-input').focus(); });
  $('#search-close').addEventListener('click', function () { closeLayer(searchPop); });
  $('#account-btn').addEventListener('click', function () { toast('演示站点 · 账户中心即将上线'); });
  $$('#menu-drawer a').forEach(function (a) {
    a.addEventListener('click', function () { closeLayer(menuDrawer); });
  });

  /* ── 购物袋 ── */
  var STORE_KEY = 'aurelle_cart_v1';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }
  function findCard(id) { return $('.card[data-id="' + id + '"]'); }
  function addToCart(id, qty) {
    var card = findCard(id);
    if (!card) return;
    qty = qty || 1;
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (item) item.qty += qty;
    else cart.push({
      id: id, qty: qty,
      name: card.dataset.name, en: card.dataset.en, price: parseFloat(card.dataset.price)
    });
    save();
    var badge = $('#cart-count');
    badge.classList.remove('show');
    void badge.offsetWidth;
    badge.classList.add('show');
    toast('已加入购物袋 · ' + card.dataset.name);
  }
  function productThumb(id) {
    var card = findCard(id);
    var svg = card && card.querySelector('.tile svg');
    if (!svg) return '';
    var clone = svg.cloneNode(true);
    prefixIds(clone, 'ct-');
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    return clone.outerHTML;
  }
  function renderCart() {
    var body = $('#cart-body');
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = cart.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
    $('#cart-count').textContent = count;
    $('#cart-count').classList.toggle('show', count > 0);
    $('#cart-subtotal').textContent = '¥' + total.toLocaleString('zh-CN');

    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty">' + icon('bag-shopping') +
        '<p>购物袋是空的</p><p style="font-size:13px;margin-top:6px">去挑选属于你的静奢仪式</p></div>';
      return;
    }
    body.innerHTML = cart.map(function (i) {
      return '<div class="cart-item" data-id="' + i.id + '">' +
        '<div class="thumb">' + productThumb(i.id) + '</div>' +
        '<div><h4>' + i.name + '</h4><p class="en">' + i.en + '</p>' +
        '<div class="stepper"><button data-dec="' + i.id + '" aria-label="减少">' + icon('minus') + '</button>' +
        '<span class="qty">' + i.qty + '</span>' +
        '<button data-inc="' + i.id + '" aria-label="增加">' + icon('plus') + '</button></div></div>' +
        '<div class="right"><span class="price">¥' + (i.qty * i.price).toLocaleString('zh-CN') + '</span>' +
        '<button class="rm" data-rm="' + i.id + '">移除</button></div></div>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add]');
    if (t) { addToCart(t.dataset.add, 1); return; }
    var inc = e.target.closest('[data-inc]');
    if (inc) { bump(inc.dataset.inc, 1); return; }
    var dec = e.target.closest('[data-dec]');
    if (dec) { bump(dec.dataset.dec, -1); return; }
    var rm = e.target.closest('[data-rm]');
    if (rm) { cart = cart.filter(function (i) { return i.id !== rm.dataset.rm; }); save(); return; }
    var qv = e.target.closest('[data-quickview]');
    if (qv) { e.preventDefault(); openQuickview(qv.dataset.quickview); return; }
  });
  function bump(id, d) {
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) cart = cart.filter(function (i) { return i.id !== id; });
    save();
  }
  $('#checkout-btn').addEventListener('click', function () {
    if (!cart.length) { toast('购物袋是空的'); return; }
    toast('演示站点 · 结算流程未接入支付');
  });
  renderCart();

  /* ── 快速查看 ── */
  var qvState = { id: null, qty: 1 };
  function openQuickview(id) {
    var card = findCard(id);
    if (!card) return;
    qvState = { id: id, qty: 1 };
    var svg = card.querySelector('.tile svg');
    var art = $('#qv-art');
    art.innerHTML = '';
    if (svg) {
      var clone = prefixIds(svg.cloneNode(true), 'qv-');
      clone.removeAttribute('width'); clone.removeAttribute('height');
      art.appendChild(clone);
    }
    $('#qv-eyebrow').textContent = 'AURELLE · Quick View';
    $('#qv-en').textContent = card.dataset.en;
    $('#qv-name').textContent = card.dataset.name;
    $('#qv-price').textContent = '¥' + parseFloat(card.dataset.price).toLocaleString('zh-CN');
    $('#qv-desc').textContent = card.dataset.desc;
    $('#qv-meta').innerHTML = '规格 30ml ｜ 全肤质适用 ｜ 无香精防腐剂<br/>顺丰次日达 · 7 天无理由退换';
    $('#qv-qty').textContent = '1';
    openLayer(quickview);
  }
  $('#qv-close').addEventListener('click', function () { closeLayer(quickview); });
  $('#qv-inc').addEventListener('click', function () { qvState.qty++; $('#qv-qty').textContent = qvState.qty; });
  $('#qv-dec').addEventListener('click', function () { if (qvState.qty > 1) { qvState.qty--; $('#qv-qty').textContent = qvState.qty; } });
  $('#qv-add').addEventListener('click', function () {
    addToCart(qvState.id, qvState.qty);
    closeLayer(quickview);
    openLayer(cartDrawer);
    renderCart();
  });

  /* ── 搜索：实时过滤产品网格 ── */
  var searchInput = $('#search-input');
  searchInput.addEventListener('input', function () {
    var q = searchInput.value.trim().toLowerCase();
    var shown = 0;
    $$('#product-grid .card').forEach(function (card) {
      var hay = (card.dataset.name + ' ' + card.dataset.en + ' ' + card.dataset.desc).toLowerCase();
      var hit = !q || hay.indexOf(q) !== -1;
      card.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    toast(q ? '找到 ' + shown + ' 件相关产品' : '');
  });
  $$('#search-pop .tags span').forEach(function (tag) {
    tag.addEventListener('click', function () {
      searchInput.value = tag.textContent;
      searchInput.dispatchEvent(new Event('input'));
    });
  });

  /* ── 订阅表单 ── */
  $('#news-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = this.querySelector('input');
    if (!input.value || input.value.indexOf('@') === -1) return;
    $('#news-msg').textContent = '订阅成功 · 欢迎加入 AURELLE 会员，礼遇码已发送至邮箱';
    input.value = '';
  });

  /* ── Toast ── */
  var toastTimer;
  function toast(msg) {
    if (!msg) return;
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#111;color:#fff;padding:12px 26px;border-radius:100px;font-size:14px;font-weight:700;z-index:200;box-shadow:rgba(0,0,0,.09) 0 10px 20px 0;opacity:0;transition:opacity .3s ease;pointer-events:none;max-width:88vw;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 2400);
  }

  /* ── 入场动效 ── */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
