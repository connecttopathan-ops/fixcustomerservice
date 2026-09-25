/*
 * Consent gate.
 *
 * The Google Ads tag is not on the page at all until someone has agreed to it.
 * Every page sets consent-mode defaults to denied in its head, before anything
 * else runs; this file is what injects gtag.js, and only after a yes.
 *
 * The answer is kept in localStorage rather than a cookie, so nothing is
 * written before consent is given, and it lapses after 180 days so people are
 * asked again rather than held to an old answer.
 *
 * Accept and Reject are the same button in the same place. A reject that is
 * harder to find than accept is not a free choice.
 */
(function () {
  var KEY = 'fcs_consent_v1', MAX = 180 * 24 * 60 * 60 * 1000, AW = 'AW-18431660031';

  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
  }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || v.v !== 1 || typeof v.ads !== 'boolean') return null;
      if (Date.now() - v.ts > MAX) return null;
      return v;
    } catch (e) { return null; }
  }
  function write(a) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ts: Date.now(), ads: !!a })); } catch (e) {}
  }

  var loaded = false;
  function loadTag() {
    if (loaded) return; loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', AW);
  }

  /* a withdrawn consent should not leave the earlier grant's cookies behind */
  function clearAdCookies() {
    try {
      var host = location.hostname, parts = host.split('.'), domains = [host, '.' + host];
      if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
      document.cookie.split(';').forEach(function (c) {
        var n = c.split('=')[0].trim();
        if (!/^(_gcl|_gac|_ga|FPAU|FPGCL)/.test(n)) return;
        domains.forEach(function (d) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
        });
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      });
    } catch (e) {}
  }

  function apply(granted) {
    gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
      analytics_storage: 'denied'
    });
    if (granted) loadTag(); else clearAdCookies();
  }

  var CSS = '.ckb{position:fixed;left:0;right:0;bottom:0;z-index:200;background:#fff;border-top:2px solid #141310;'
    + 'box-shadow:0 -14px 40px rgba(20,19,16,.14);padding:20px 0 22px;font-family:inherit}'
    + '.ckb[hidden]{display:none}'
    + '.ckb-in{max-width:1080px;margin:0 auto;padding:0 26px;display:grid;grid-template-columns:1fr auto;gap:16px 40px;align-items:start}'
    + '.ckb-copy{max-width:56em}'
    + '.ckb-h{margin:0 0 6px;font-size:1.02rem;font-weight:800;letter-spacing:-.015em;color:#141310}'
    + '.ckb-copy p{margin:0;font-size:.94rem;line-height:1.5;color:#5F594F;max-width:none}'
    + '.ckb-more{margin-top:8px!important}'
    + '.ckb-more a{color:#141310;font-weight:600;text-decoration:none;border-bottom:2px solid #FBDD5C}'
    + '.ckb-opts{grid-column:1/-1;display:grid;gap:10px;border-top:1px solid #E6DFD3;padding-top:14px}'
    + '.ckb-opts[hidden]{display:none}'
    + '.ckb-opt{display:grid;grid-template-columns:20px 1fr;gap:11px;align-items:start;font-size:.9rem;color:#5F594F;cursor:pointer}'
    + '.ckb-opt input{width:18px;height:18px;margin:2px 0 0;accent-color:#141310}'
    + '.ckb-opt input:disabled{opacity:.55}'
    + '.ckb-opt b{display:block;color:#141310;font-weight:700;font-size:.94rem;margin-bottom:1px}'
    + '.ckb-acts{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-self:end}'
    + '.ckb-btn{font:inherit;font-weight:700;font-size:.94rem;padding:11px 22px;border-radius:999px;cursor:pointer;'
    + 'border:2px solid #141310;background:#141310;color:#fff;transition:transform .14s ease,background .18s ease}'
    + '.ckb-btn:hover{transform:translateY(-1px)}'
    + '.ckb-btn[data-ck="reject"]{background:#fff;color:#141310}'
    + '.ckb-btn[data-ck="reject"]:hover{background:#FAF6EE}'
    + '.ckb-alt{font:inherit;font-size:.92rem;color:#5F594F;background:none;border:0;cursor:pointer;'
    + 'border-bottom:2px solid #E6DFD3;padding:0 0 2px}'
    + '.ckb-alt:hover{color:#141310;border-bottom-color:#FBDD5C}'
    + '@media (max-width:820px){.ckb{padding:16px 0 18px}'
    + '.ckb-in{grid-template-columns:1fr;gap:14px;padding:0 20px}'
    + '.ckb-acts{justify-self:stretch}.ckb-acts .ckb-btn{flex:1 1 0}}'
    + '@media (prefers-reduced-motion:reduce){.ckb-btn{transition:none}.ckb-btn:hover{transform:none}}';

  var HTML = '<div class="ckb-in">'
    + '<div class="ckb-copy">'
    + '<p class="ckb-h" id="ckb-h">Advertising cookies</p>'
    + '<p>Nothing beyond what the site needs to work is loaded until you agree to it. Advertising cookies let us see which ads brought people here. Saying no changes nothing about how the site works, and you can change your mind from the cookie settings link in the footer.</p>'
    + '<p class="ckb-more"><a href="/privacy">What we collect and why</a></p>'
    + '</div>'
    + '<div class="ckb-acts">'
    + '<button type="button" class="ckb-btn" data-ck="accept">Accept</button>'
    + '<button type="button" class="ckb-btn" data-ck="reject">Reject</button>'
    + '<button type="button" class="ckb-alt" data-ck="choose">Choose</button>'
    + '<button type="button" class="ckb-btn" data-ck="save" hidden>Save choices</button>'
    + '</div>'
    + '<div class="ckb-opts" hidden>'
    + '<label class="ckb-opt"><input type="checkbox" checked disabled><span><b>Necessary</b>Serving the pages, and remembering the choice you make here. Always on, and it uses browser storage rather than a cookie.</span></label>'
    + '<label class="ckb-opt"><input type="checkbox" data-ck-ads><span><b>Advertising</b>Google Ads, so we can tell which ads led to an enquiry. Off unless you switch it on.</span></label>'
    + '</div></div>';

  var box, opts, adsBox, saveBtn, chooseBtn;
  function build() {
    if (box) return;
    var st = document.createElement('style'); st.textContent = CSS;
    document.head.appendChild(st);
    box = document.createElement('div');
    box.className = 'ckb'; box.id = 'ckb';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-labelledby', 'ckb-h');
    box.hidden = true;
    box.innerHTML = HTML;
    document.body.appendChild(box);
    opts = box.querySelector('.ckb-opts');
    adsBox = box.querySelector('[data-ck-ads]');
    saveBtn = box.querySelector('[data-ck="save"]');
    chooseBtn = box.querySelector('[data-ck="choose"]');
    box.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ck]'); if (!t) return;
      var a = t.getAttribute('data-ck');
      if (a === 'choose') { opts.hidden = false; saveBtn.hidden = false; chooseBtn.hidden = true; return; }
      var granted = a === 'accept' ? true : a === 'reject' ? false : !!(adsBox && adsBox.checked);
      write(granted); apply(granted); box.hidden = true;
    });
  }
  function open(existing) {
    build();
    if (adsBox) adsBox.checked = !!(existing && existing.ads);
    opts.hidden = true; saveBtn.hidden = true; chooseBtn.hidden = false;
    box.hidden = false;
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-cookie-open]')) return;
    e.preventDefault();
    open(read());
  });

  var saved = read();
  if (saved) apply(saved.ads); else open(null);
})();
