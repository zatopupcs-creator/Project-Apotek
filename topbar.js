/* Bar atas ringkas (HP): muncul dengan animasi saat halaman di-scroll, tidak ikut bergulir. */
(() => {
  const mq = matchMedia('(max-width:999px)');
  const SEARCH = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const BELL = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  let bar, titleEl, searchBtn, bellBtn, ticking = false;

  function build() {
    bar = document.createElement('div');
    bar.id = 'topbar';
    bar.className = 'topbar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span class="tbtitle"></span><div class="tbact">' +
      '<button type="button" class="tbbtn tbsearch" aria-label="Cari" tabindex="-1">' + SEARCH + '</button>' +
      '<button type="button" class="bellbtn tbbtn tbbell" data-a="notif" aria-label="Pengingat kedaluwarsa" tabindex="-1" hidden>' + BELL + '<span class="bellbadge" hidden></span></button></div>';
    document.body.appendChild(bar);
    titleEl = bar.querySelector('.tbtitle');
    searchBtn = bar.querySelector('.tbsearch');
    bellBtn = bar.querySelector('.tbbell');
    searchBtn.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const toggle = document.querySelector('main .searchtoggle'), row = document.querySelector('.msearch');
        if (toggle && row && !row.classList.contains('open')) toggle.click();
        const input = document.querySelector('main input[type=search]');
        if (input) input.focus();
      }, 350);
    });
  }

  function sync() {
    if (!bar) return;
    const head = document.querySelector('main .pagehead'), h1 = head && head.querySelector('h1');
    titleEl.textContent = h1 ? h1.textContent : '';
    searchBtn.hidden = !document.querySelector('main input[type=search]');
    const pageBell = head && head.querySelector('.bellbtn');
    if (pageBell) {
      const a = pageBell.querySelector('.bellbadge'), b = bellBtn.querySelector('.bellbadge');
      if (a && b) { b.hidden = a.hidden; b.textContent = a.textContent; b.className = a.className; }
      bellBtn.hidden = pageBell.hidden;
    } else bellBtn.hidden = true;
    update();
  }

  function update() {
    ticking = false;
    if (!bar) return;
    const head = document.querySelector('main .pagehead');
    const ok = mq.matches && head && document.body.classList.contains('has-side') &&
      !document.body.classList.contains('subpage') && !document.body.classList.contains('cartpage');
    const show = Boolean(ok && head.getBoundingClientRect().bottom < 4);
    bar.classList.toggle('show', show);
    bar.setAttribute('aria-hidden', String(!show));
    searchBtn.tabIndex = bellBtn.tabIndex = show ? 0 : -1;
  }

  function init() {
    build();
    const main = document.getElementById('main');
    if (main) new MutationObserver(sync).observe(main, { childList: true, subtree: false });
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
