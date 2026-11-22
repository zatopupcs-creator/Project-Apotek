/* Bee Farma - aplikasi utama: login, routing menu, kasir, form, dan event. */
(() => {
  const D = ApotekData, U = ApotekUI, M = ApotekManagement, S = ApotekSettings, N = ApotekNavigation;
  const {h, rp, icon, btn, ib, field, head, empty, photo, ticket, search, line, nomor} = U;
  const {menus} = D;
  const $ = id => document.getElementById(id);
  const main = $('main'), dialog = $('dialog'), toastEl = $('toast'), printEl = $('print');

  let d = null, me = null, brand = {name: '', logo: ''}, page = '', busy = false;
  const cart = new Map();
  const pos = {q: '', cat: 'Semua', discount: 0};
  let settingsTab = 'bisnis', draftLogo = '', saleId = null;

  const can = m => Boolean(me && (me.owner || (me.menus || []).includes(m)));
  const num = v => Math.max(0, Math.floor(Number(v) || 0));
  const stockLeft = p => p.stock - (cart.get(p.id) || 0);

  /* ---------- Notifikasi ---------- */
  let toastTimer;
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    const mark = error
      ? '<span class="okwrap err"><svg class="okmark" viewBox="0 0 36 36"><circle class="okc" cx="18" cy="18" r="15"/><path class="xp1" d="M12 12l12 12"/><path class="xp2" d="M24 12L12 24"/></svg></span>'
      : '<span class="okwrap"><svg class="okmark" viewBox="0 0 36 36"><circle class="okc" cx="18" cy="18" r="15"/><path class="okp" d="M11 18.5l5 5 9-10"/></svg></span>';
    toastEl.className = error ? 'error' : '';
    toastEl.innerHTML = mark + '<span>' + h(message) + '</span>';
    toastTimer = setTimeout(() => { toastEl.innerHTML = ''; toastEl.className = ''; }, error ? 4200 : 2600);
  }
  const fail = e => toast(e?.message || 'Terjadi kesalahan.', true);

  function setError(form, message) {
    let el = form.querySelector('.error');
    if (!el) {
      el = document.createElement('p'); el.className = 'error'; el.setAttribute('role', 'alert');
      form.querySelector('button:not([type=button])')?.before(el);
    }
    el.textContent = message || '';
  }
  async function withBusy(button, fn) {
    if (busy) return; busy = true; button?.classList.add('loading');
    try { return await fn(); } finally { busy = false; button?.classList.remove('loading'); }
  }

  /* ---------- Dialog ---------- */
  function openDialog(title, body, wide = false) {
    dialog.innerHTML = '<div class="modalhead"><h2>' + h(title) + '</h2>' + ib('close', 'Tutup', 'close') + '</div><div class="modalbody">' + body + '</div>';
    dialog.classList.toggle('wide', wide);
    if (!dialog.open) dialog.showModal();
  }
  const closeDialog = () => { if (dialog.open) dialog.close(); };
  dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => { dialog.replaceChildren(); });

  /* ---------- Data ---------- */
  async function refresh() {
    d = await D.state();
    me = d.me;
    if (!me?.owner && !Array.isArray(me?.menus)) me.menus = [];
    brand = {name: d.settings?.name || brand.name, logo: d.settings?.logo || ''};
  }
  const allowedPages = () => Object.keys(menus).filter(can);
  function pickPage() {
    const saved = sessionStorage.getItem('figiha.page');
    const ok = allowedPages();
    page = ok.includes(page) ? page : ok.includes(saved) ? saved : ok[0] || '';
    sessionStorage.setItem('figiha.page', page);
  }

  /* ---------- Tampilan ---------- */
  function showLogin(errorMessage = '') {
    d = null; me = null; cart.clear();
    N.renderNavigation(null, '', brand, can);
    main.innerHTML = S.loginView(errorMessage, brand.name, brand.logo);
    if (errorMessage) setError($('loginform'), errorMessage);
  }
  async function loadBrand() {
    try {
      const b = await D.branding();
      if (b?.name || b?.logo) { brand = {name: b.name || '', logo: b.logo || ''}; S.updateLoginBrand(brand.name, brand.logo); }
    } catch { /* tetap pakai tampilan bawaan */ }
  }

  function catalogCards() {
    const q = pos.q.trim().toLowerCase();
    const list = d.products.filter(p => (pos.cat === 'Semua' || p.category === pos.cat) && (!q || (p.name + ' ' + (p.sku || '') + ' ' + (p.detail || '')).toLowerCase().includes(q)));
    if (!list.length) return empty('Produk tidak ditemukan', 'Coba kata kunci atau kategori lain.');
    return '<div class="products" id="cataloglist">' + list.map(p => {
      const left = stockLeft(p);
      return '<article class="card" data-pid="' + h(p.id) + '"><span class="photo">' + photo(p) + '</span><div class="cardbody"><span class="tag">' + h(p.category) + '</span><h3>' + h(p.name) + '</h3><span class="productdesc">' + h(p.detail || '') + '</span>' +
        '<div class="cardbottom"><div><span class="price">' + rp(p.price) + '</span><span class="unit"> / ' + h(p.unit) + '</span></div>' +
        '<div class="addcol"><span class="stocktag"><span class="stocknum">' + left + '</span> stok</span>' +
        '<button type="button" class="square" data-a="add" data-id="' + h(p.id) + '" aria-label="Tambah ' + h(p.name) + '" ' + (left < 1 ? 'disabled' : '') + '>' + icon('plus', 16) + '</button></div></div></div></article>';
    }).join('') + '</div>';
  }
  const cartLines = () => [...cart].map(([id, qty]) => ({p: d.products.find(x => x.id === id), qty})).filter(x => x.p);
  const subtotal = () => cartLines().reduce((n, x) => n + x.p.price * x.qty, 0);
  const discountValue = () => Math.min(num(pos.discount), subtotal());
  function cartPanel() {
    const rows = cartLines();
    const count = rows.reduce((n, x) => n + x.qty, 0);
    const body = rows.length
      ? '<div class="cartitems">' + rows.map(({p, qty}) => '<div class="cartitem"><div class="carttext" style="flex:1;min-width:0"><b>' + h(p.name) + '</b><br><small class="muted">' + rp(p.price) + ' × ' + qty + '</small></div>' +
        '<div class="qty"><button type="button" data-a="dec" data-id="' + h(p.id) + '" aria-label="Kurangi">−</button><b>' + qty + '</b><button type="button" data-a="inc" data-id="' + h(p.id) + '" aria-label="Tambah" ' + (stockLeft(p) < 1 ? 'disabled' : '') + '>+</button></div>' +
        '<b>' + rp(p.price * qty) + '</b>' + ib('rm', 'Hapus ' + p.name, 'trash', p.id) + '</div>').join('') + '</div>'
      : '<div class="emptycart"><div class="receipt-art"><div class="paper"><i></i><i></i><i></i></div></div><strong>Keranjang masih kosong</strong><p>Pilih produk di sebelah kiri untuk memulai transaksi.</p></div>';
    const total = subtotal() - discountValue();
    return '<div class="boxhead"><div class="boxname"><span class="boxicon">' + icon('kasir', 19) + '</span><h2>Keranjang</h2></div><span class="count">' + count + ' item</span></div>' + body +
      '<div class="summary">' + line('Subtotal', rp(subtotal())) +
      '<label class="field" style="margin:12px 0 0">Diskon (Rp)<input class="control" id="discount" type="number" min="0" step="1" inputmode="numeric" value="' + (pos.discount || '') + '" placeholder="0"></label>' +
      '<div class="flexprice total"><span>Total</span><strong id="cart-total">' + rp(total) + '</strong></div>' +
      '<button type="button" class="btn dark full" data-a="checkout" ' + (rows.length ? '' : 'disabled') + '>' + icon('receipt', 17) + 'Bayar</button>' +
      '<p class="hint">' + icon('check', 14) + 'Stok berkurang otomatis setelah pembayaran.</p></div>';
  }
  function kasirView() {
    const cats = ['Semua', ...D.categories.filter(c => d.products.some(p => p.category === c)), ...[...new Set(d.products.map(p => p.category))].filter(c => !D.categories.includes(c))];
    return head('Kasir', 'Pilih produk dan selesaikan transaksi penjualan.', '') +
      '<div class="pos"><div class="catalog">' + search('catq', pos.q, 'Cari nama produk atau SKU…') +
      '<div class="chips">' + cats.map(c => '<button type="button" class="chip ' + (pos.cat === c ? 'on' : '') + '" data-a="cat" data-id="' + h(c) + '">' + h(c) + '</button>').join('') + '</div>' +
      '<div id="catalogwrap">' + catalogCards() + '</div></div>' +
      '<aside class="cartpanel" id="cartbox" aria-label="Keranjang">' + cartPanel() + '</aside></div>' +
      '<button type="button" class="btn dark floatcart" data-a="gocart">' + icon('kasir', 17) + '<span id="floatcount">' + cartLines().reduce((n, x) => n + x.qty, 0) + '</span> item</button>';
  }
  function render() {
    if (!me) return;
    pickPage();
    N.renderNavigation(me, page, brand, can);
    if (!page) { main.innerHTML = empty('Belum ada akses menu', 'Hubungi pemilik apotek untuk mengatur akses akun ini.'); return; }
    if (page === 'kasir') main.innerHTML = kasirView();
    else if (page === 'pengaturan') main.innerHTML = S.settingsView(d, settingsTab, draftLogo);
    else main.innerHTML = M.management(page, d);
  }
  function updateCart() {
    const box = $('cartbox'); if (!box) return;
    box.innerHTML = cartPanel();
    const fc = $('floatcount'); if (fc) fc.textContent = cartLines().reduce((n, x) => n + x.qty, 0);
    document.querySelectorAll('#cataloglist .card').forEach(card => {
      const p = d.products.find(x => x.id === card.dataset.pid); if (!p) return;
      const left = stockLeft(p);
      card.querySelector('.stocknum').textContent = left;
      card.querySelector('[data-a="add"]').disabled = left < 1;
      card.querySelector('.stocktag').classList.toggle('dec', cart.has(p.id));
    });
  }
  function updateTotal() {
    const t = $('cart-total'); if (t) t.textContent = rp(subtotal() - discountValue());
  }

  /* ---------- Masuk ---------- */
  async function start() {
    N.preload();
    try {
      if (D.session()) {
        await refresh(); render();
      } else {
        const local = !D.config() && D.needsOwner();
        N.renderNavigation(null, '', brand, can);
        if (local) { main.innerHTML = '<div class="login-stage"><section class="signin-card"><div class="signin-form"><h1>Buat akun pemilik</h1>' + S.ownerForm() + '</div></section></div>'; }
        else { showLogin(); loadBrand(); }
      }
    } catch (e) {
      D.logout(); showLogin(); loadBrand();
      if (e?.message) toast(e.message, true);
    }
    document.body.classList.add('ready');
  }
  async function enter() { await refresh(); page = ''; render(); }

  /* ---------- Gambar produk ---------- */
  async function shrinkImage(file, max = 640) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw Error('Pilih foto JPG, PNG, atau WebP hingga 8 MB.');
    const src = await createImageBitmap(file);
    try {
      const k = Math.min(1, max / Math.max(src.width, src.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .82);
    } finally { src.close(); }
  }

  /* ---------- Aksi (klik) ---------- */
  const actions = {
    nav(id) { page = id; sessionStorage.setItem('figiha.page', id); M.mg.search = ''; render(); N.selectMenu(); scrollTo(0, 0); },
    togglemenu() { N.toggleMenu(); },
    togglegroup(_, el) { const g = el.closest('.snav-group'); const c = g.classList.toggle('collapsed'); el.setAttribute('aria-expanded', String(!c)); },
    logout() { D.logout(); cart.clear(); me = null; d = null; closeDialog(); N.closeMenu(false); showLogin(); loadBrand(); },
    account() {
      openDialog('Akun saya', line('Nama', me.name) + line('Username', me.username || '—') + line('ID pegawai', me.employee_code || '—') + line('Peran', me.owner ? 'Pemilik' : 'Pegawai') +
        '<div class="tools sectiongap">' + (me.owner ? btn('password', 'Ganti kata sandi', 'user', '', me.id) : '') + btn('logout', 'Keluar', 'user') + '</div>');
    },
    close() { closeDialog(); },
    cat(id) { pos.cat = id; document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.id === id)); $('catalogwrap').innerHTML = catalogCards(); },
    add(id) {
      const p = d.products.find(x => x.id === id); if (!p || stockLeft(p) < 1) return;
      cart.set(id, (cart.get(id) || 0) + 1); updateCart();
    },
    inc(id) { actions.add(id); },
    dec(id) { const n = (cart.get(id) || 0) - 1; if (n < 1) cart.delete(id); else cart.set(id, n); updateCart(); },
    rm(id) { cart.delete(id); updateCart(); },
    gocart() { $('cartbox')?.scrollIntoView({behavior: 'smooth', block: 'start'}); },
    checkout() {
      if (!cart.size) return;
      const total = subtotal() - discountValue();
      openDialog('Pembayaran',
        '<form id="checkoutform"><div class="stack">' + line('Total tagihan', rp(total), 'total') +
        field('Metode pembayaran', 'method', 'Tunai', {items: ['Tunai', 'QRIS', 'Transfer', 'Kartu debit']}) +
        field('Uang diterima (Rp)', 'paid', total, {type: 'number', required: true, min: total, extra: 'step="1" inputmode="numeric"'}) +
        '<div class="tools">' + btn('exact', 'Uang pas', '', '') + '</div>' +
        '<div id="changebox">' + line('Kembalian', rp(0)) + '</div></div>' + U.formEnd('Selesaikan transaksi') + '</form>');
      saleId = D.uuid();
      dialog.querySelector('[name="paid"]')?.select();
    },
    exact() { const i = dialog.querySelector('[name="paid"]'); if (i) { i.value = subtotal() - discountValue(); i.dispatchEvent(new Event('input', {bubbles: true})); } },
    receipt(id) {
      const s = d.sales.find(x => x.id === id); if (!s) return;
      openDialog('Struk ' + nomor(s), '<div id="ticketview">' + ticket(s) + '</div><div class="actions"><button type="button" class="btn primary" data-a="print" data-id="' + h(s.id) + '">' + icon('receipt', 17) + 'Cetak struk</button></div>');
    },
    print(id) {
      const s = d.sales.find(x => x.id === id); if (!s) return;
      printEl.innerHTML = ticket(s);
      document.documentElement.style.setProperty('--paper', s.business?.width === '58' ? '58mm' : '80mm');
      const clear = () => { printEl.innerHTML = ''; removeEventListener('afterprint', clear); };
      addEventListener('afterprint', clear);
      print();
    },
    product(id) {
      const p = id ? d.products.find(x => x.id === id) : {};
      openDialog(id ? 'Edit produk' : 'Tambah produk', M.productForm(p || {}, d), true);
      dialog.querySelector('form').dataset.id = id || '';
    },
    async deleteproduct(id, el) {
      const p = d.products.find(x => x.id === id); if (!p) return;
      if (!confirm('Hapus produk "' + p.name + '"?')) return;
      await withBusy(el, async () => {
        try { await D.remove('products', id, p.rev); await refresh(); cart.delete(id); render(); toast('Produk dihapus.'); } catch (e) { fail(e); }
      });
    },
    supplier(id) {
      const s = id ? d.suppliers.find(x => x.id === id) : {};
      openDialog(id ? 'Edit suplier' : 'Tambah suplier', M.supplierForm(s || {}));
      dialog.querySelector('form').dataset.id = id || '';
    },
    employee(id) {
      const s = id ? d.staff.find(x => x.id === id) : undefined;
      openDialog(id ? 'Edit akun' : 'Tambah akun', M.employeeForm(s, d));
      dialog.querySelector('form').dataset.id = id || '';
    },
    contact(id) {
      const s = d.suppliers.find(x => x.id === id); if (!s) return;
      openDialog(s.name, M.contact(s, d.products));
    },
    password(id) {
      const s = d.staff.find(x => x.id === id) || (me.id === id ? me : null); if (!s) return;
      openDialog('Kata sandi akun', S.passwordForm(s));
      dialog.querySelector('form').dataset.id = id;
    },
    export() { openDialog('Ekspor laporan', M.exportChooser()); },
    'export-pdf'() { try { M.exportPdf(d); closeDialog(); } catch (e) { fail(e); } },
    'export-csv'() { try { M.exportCsv(d); closeDialog(); } catch (e) { fail(e); } },
    tab(id) { settingsTab = id; draftLogo = d.settings.logo || ''; render(); },
    clearlogo() { draftLogo = ''; S.updateLogoTile(''); refreshPreview(); },
    async copycfg() {
      try { await navigator.clipboard.writeText($('cfgcode').value); toast('Kode disalin.'); } catch { $('cfgcode')?.select(); toast('Tekan Ctrl+C untuk menyalin.'); }
    },
    async test(_, el) {
      const f = $('configform'); if (!f) return;
      await withBusy(el, async () => {
        try { const c = D.parseConfig(f.url.value, f.key.value); await D.testConfig(c); setError(f, ''); toast('Koneksi berhasil.'); }
        catch (e) { setError(f, e.message); }
      });
    },
    disconnect() {
      if (!confirm('Putuskan database? Anda akan keluar dari akun ini.')) return;
      D.disconnect(); location.reload();
    }
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const fn = actions[el.dataset.a]; if (!fn) return;
    Promise.resolve(fn(el.dataset.id || '', el)).catch(fail);
  });
  // tombol tampil/sembunyi kata sandi
  document.addEventListener('click', e => {
    const t = e.target.closest('.pwtoggle'); if (!t) return;
    const input = t.closest('.inputicon').querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password'; t.classList.toggle('on', show);
    t.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  });

  /* ---------- Form (submit) ---------- */
  const forms = {
    async loginform(f, button) {
      await withBusy(button, async () => {
        try {
          await D.login(f.identifier.value, f.password.value);
          await enter();
        } catch (e) { setError(f, e.message); f.password.select(); }
      });
    },
    async ownerform(f, button) {
      await withBusy(button, async () => {
        try {
          const fd = new FormData(f);
          await D.setupDemoOwner({name: String(fd.get('name')), username: String(fd.get('username')), employee_code: String(fd.get('employee_code'))}, String(fd.get('password')));
          await enter();
        } catch (e) { setError(f, e.message); }
      });
    },
    async checkoutform(f, button) {
      await withBusy(button, async () => {
        try {
          const items = cartLines().map(({p, qty}) => ({id: p.id, qty}));
          const paid = num(f.paid.value), method = f.method.value;
          const sale = await D.checkout(saleId || D.uuid(), items, discountValue(), paid, method);
          cart.clear(); pos.discount = 0; saleId = null;
          await refresh();
          closeDialog(); render();
          await celebrate();
          d.sales = d.sales.some(s => s.id === sale.id) ? d.sales : [sale, ...d.sales];
          actions.receipt(sale.id);
        } catch (e) { setError(f, e.message); }
      });
    },
    async productform(f, button) {
      await withBusy(button, async () => {
        try {
          const id = f.dataset.id, old = id ? d.products.find(x => x.id === id) : null, fd = new FormData(f);
          const data = {
            name: String(fd.get('name') || '').trim(), sku: String(fd.get('sku') || '').trim(), category: String(fd.get('category') || D.categories[0]),
            unit: String(fd.get('unit') || '').trim(), detail: String(fd.get('detail') || '').trim(),
            cost: num(fd.get('cost')), price: num(fd.get('price')), stock: num(fd.get('stock')), minimum: num(fd.get('minimum')),
            supplier: String(fd.get('supplier') || ''), batch: String(fd.get('batch') || '').trim(), expiry: String(fd.get('expiry') || ''),
            image: old?.image || ''
          };
          const file = fd.get('upload');
          if (file && file.size) data.image = await shrinkImage(file);
          await D.save('products', id || D.uuid(), old?.rev || 0, data);
          await refresh(); closeDialog(); render(); toast(id ? 'Produk diperbarui.' : 'Produk ditambahkan.');
        } catch (e) { setError(f, e.message); }
      });
    },
    async supplierform(f, button) {
      await withBusy(button, async () => {
        try {
          const id = f.dataset.id, old = id ? d.suppliers.find(x => x.id === id) : null, fd = new FormData(f);
          const data = Object.fromEntries(['name', 'contact', 'phone', 'wa', 'email', 'address'].map(k => [k, String(fd.get(k) || '').trim()]));
          await D.save('suppliers', id || D.uuid(), old?.rev || 0, data);
          await refresh(); closeDialog(); render(); toast('Suplier disimpan.');
        } catch (e) { setError(f, e.message); }
      });
    },
    async employeeform(f, button) {
      await withBusy(button, async () => {
        try {
          const id = f.dataset.id, old = id ? d.staff.find(x => x.id === id) : null, fd = new FormData(f);
          const data = {
            name: String(fd.get('name') || '').trim(), username: String(fd.get('username') || '').trim(), employee_code: String(fd.get('employee_code') || '').trim(),
            active: old?.owner ? true : fd.has('active') || !id && !f.querySelector('[name="active"]'),
            menus: old?.owner ? old.menus : fd.getAll('menus').map(String)
          };
          if (!data.name) throw Error('Nama wajib diisi.');
          const target = id || D.uuid();
          await D.save('staff', target, old?.rev || 0, data);
          if (!id) {
            try { await D.setPassword(target, String(fd.get('password') || '')); }
            catch (e) { await refresh(); render(); throw Error('Akun tersimpan, tetapi kata sandi gagal dipasang: ' + e.message); }
          }
          await refresh(); closeDialog(); render(); toast(id ? 'Akun diperbarui.' : 'Akun didaftarkan.');
        } catch (e) { setError(f, e.message); }
      });
    },
    async passwordform(f, button) {
      await withBusy(button, async () => {
        try { await D.setPassword(f.dataset.id, f.password.value); await refresh(); closeDialog(); render(); toast('Kata sandi disimpan.'); }
        catch (e) { setError(f, e.message); }
      });
    },
    async businessform(f, button) {
      await withBusy(button, async () => {
        try {
          const v = S.receiptValues(f, draftLogo);
          if (!v.name) throw Error('Nama apotek wajib diisi.');
          await D.save('settings', d.settings.id, d.settings.rev, v);
          await refresh(); draftLogo = d.settings.logo || ''; render(); toast('Pengaturan disimpan.');
        } catch (e) { setError(f, e.message); }
      });
    },
    async configform(f, button) {
      await withBusy(button, async () => {
        try {
          const c = D.parseConfig(f.url.value, f.key.value);
          await D.connect(c); toast('Database terhubung.'); setTimeout(() => location.reload(), 600);
        } catch (e) { setError(f, e.message); }
      });
    }
  };
  document.addEventListener('submit', e => {
    const f = e.target, fn = forms[f.id]; if (!fn) return;
    e.preventDefault();
    fn(f, f.querySelector('button[type=submit], .btn.primary, .btn.dark')).catch(fail);
  });

  /* ---------- Input ---------- */
  function refreshPreview() {
    const f = $('businessform'), box = $('receipt-preview'); if (!f || !box) return;
    box.innerHTML = S.receiptPreview(S.receiptValues(f, draftLogo));
  }
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'catq') { pos.q = t.value; $('catalogwrap').innerHTML = catalogCards(); }
    else if (t.id === 'discount') { pos.discount = num(t.value); updateTotal(); }
    else if (t.id === 'mgsearch') { M.mg.search = t.value; const rows = $('mgrows'); if (rows && d) rows.innerHTML = M.managementRows(page === 'pengaturan' ? 'pegawai' : page, d); }
    else if (t.name === 'paid' && t.form?.id === 'checkoutform') {
      const total = subtotal() - discountValue(), change = num(t.value) - total;
      $('changebox').innerHTML = line(change < 0 ? 'Kurang' : 'Kembalian', rp(Math.abs(change)));
    }
    else if (t.form?.id === 'businessform' && t.type !== 'file') refreshPreview();
  });
  document.addEventListener('change', async e => {
    const t = e.target;
    if (t.form?.id === 'businessform' && t.name === 'logoFile' && t.files[0]) {
      try { draftLogo = await S.resizeLogo(t.files[0]); S.updateLogoTile(draftLogo); refreshPreview(); } catch (err) { fail(err); }
      t.value = '';
    } else if (t.form?.id === 'businessform') refreshPreview();
  });
  document.addEventListener('dp-range', e => {
    Object.assign(M.mg, {preset: e.detail.preset, from: e.detail.from, to: e.detail.to});
    if (d && page === 'laporan') render();
  });

  /* ---------- Animasi sukses ---------- */
  function celebrate() {
    const el = document.createElement('div'); el.className = 'donefx';
    el.innerHTML = '<div class="donebox"><div class="donering"><svg viewBox="0 0 160 160"><circle class="dc" cx="80" cy="80" r="70"/><path class="dp" d="M50 82l22 22 40-46"/></svg>' + '<i></i>'.repeat(8) + '</div><strong>Pembayaran berhasil</strong><span>Transaksi telah disimpan</span></div>';
    document.body.append(el);
    return new Promise(r => setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); r(); }, 300); }, 1700));
  }

  start();
})();
