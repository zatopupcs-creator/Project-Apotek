(() => {
  const db = ApotekData;
  const {h,rp,date,nomor,head,btn,ib,field,icon,line,ticket,photo,search,empty,formEnd,logoUrl} = ApotekUI;
  const {management,managementRows,productForm,supplierForm,employeeForm,contact,exportCsv,exportPdf,exportChooser,mg} = ApotekManagement;
  const {connectionView,loginView,updateLoginBrand,ownerForm,passwordForm,settingsView,receiptValues,receiptPreview,resizeLogo,updateLogoTile} = ApotekSettings;
  const {renderNavigation,selectMenu,toggleMenu,closeMenu,preload} = ApotekNavigation;
  const $=s=>document.querySelector(s),dlg=$('#dialog');
  let data,page=location.hash.slice(1)||'kasir',query='',category='Semua',sort='default',available=false,cart={},discount=0,cartKey='',orderId='',settingsTab='bisnis',editing=null,currentSale=null,authError='',pending=false,timer,busy=false;
  let brand={name:'Bee Farma',logo:''},draftLogo='',refreshId=0,employeeDraftId='',logoTask=null;
  const owner=()=>Boolean(data?.me?.owner);
  const allowed=m=>Boolean(data&&Object.hasOwn(db.menus,m)&&(owner()||m!=='pegawai'&&data.me.menus.includes(m)));
  const product=id=>data.products.find(p=>p.id===id);
  const asForm=form=>Object.fromEntries(new FormData(form));
  const feedback=(msg,kind='ok')=>{const t=$('#toast');t.className=kind==='error'?'error':'';t.innerHTML=(kind==='error'?'<span class="okwrap err"><svg class="okmark" viewBox="0 0 52 52" aria-hidden="true"><circle class="okc" cx="26" cy="26" r="23"/><path class="xp1" d="M18 18l16 16"/><path class="xp2" d="M34 18L18 34"/></svg></span>':'<span class="okwrap"><svg class="okmark" viewBox="0 0 52 52" aria-hidden="true"><circle class="okc" cx="26" cy="26" r="23"/><path class="okp" d="M15 27l8 8 15-17"/></svg></span>')+'<span>'+h(msg)+'</span>';clearTimeout(timer);timer=setTimeout(()=>{t.className='';t.innerHTML=''},3300)};
  function modal(title,body){dlg.innerHTML='<div class="modalhead"><h2>'+h(title)+'</h2>'+ib('close','Tutup','close')+'</div><div class="modalbody">'+body+'</div>';if(!dlg.open)dlg.showModal()}
  function close(){if(dlg.open)dlg.close();dlg.replaceChildren();editing=null}
  function loadDraft(){
   const key='figiha.cart.'+(db.config()?.url||'demo')+'.'+data.me.id;
   if(key===cartKey)return;cartKey=key;const draft=JSON.parse(sessionStorage.getItem(key)||'{}');cart=draft.cart||{};discount=draft.discount||0;orderId=draft.id||db.uuid();pending=Boolean(draft.pending);
  }
  function saveDraft(){sessionStorage.setItem(cartKey,JSON.stringify({cart,discount,id:orderId,pending}))}
  function resetDraft(){cart={};discount=0;orderId=db.uuid();pending=false;saveDraft()}
  function cartLines(){return Object.entries(cart).map(([id,qty])=>({p:product(id),qty})).filter(x=>x.p&&x.qty>0)}
  function totals(){let lines=cartLines(),sub=lines.reduce((n,{p,qty})=>n+p.price*qty,0),qty=lines.reduce((n,x)=>n+x.qty,0);return {sub,qty,total:Math.max(0,sub-discount),lines}}
  function skeleton(){
   const bar=(cls)=>'<i class="sk '+cls+'"></i>';
   const head='<div class="pagehead"><div>'+bar('sk-title')+bar('sk-sub')+'</div></div>';
   const status='<span class="sr" role="status">Memuat data…</span>';
   if(page==='kasir')return status+head+'<div class="pos"><section class="catalog">'+bar('sk-search')+'<div class="sk-chips">'+bar('sk-chip')+bar('sk-chip')+bar('sk-chip')+bar('sk-chip')+'</div><div class="products">'+Array.from({length:6},()=>'<div class="card"><i class="sk sk-photo"></i><div class="cardbody">'+bar('sk-line w60')+bar('sk-line w80')+bar('sk-line w40')+'</div></div>').join('')+'</div></section><aside class="cartpanel sk-cart">'+bar('sk-line w60')+bar('sk-block')+bar('sk-line w80')+bar('sk-line w80')+bar('sk-btn')+'</aside></div>';
   return status+head+'<section class="panel">'+bar('sk-search')+Array.from({length:6},()=>'<div class="sk-row">'+bar('sk-thumb')+'<div class="sk-grow">'+bar('sk-line w40')+bar('sk-line w20')+'</div>'+bar('sk-line w15')+bar('sk-line w15')+'</div>').join('')+'</section>';
  }
  async function refresh(){
   const id=++refreshId;
   if(!db.session()){
    data=null;currentSale=null;$('#print').innerHTML='';close();render();
    try{const publicBrand=await db.branding();if(id===refreshId&&publicBrand&&!data){const changed=publicBrand.name!==brand.name||publicBrand.logo!==brand.logo;brand=publicBrand;if(changed&&!document.querySelector('#loginform input:not(:placeholder-shown)'))render();else{renderNavigation(null,page,brand,allowed);updateLoginBrand(brand.name,brand.logo)}}}
    catch{}
    return;
   }
   try{
    if(!data)$('#main').innerHTML=skeleton();
    const fresh=await db.state();if(id!==refreshId)return;
    data=fresh;brand={name:data.settings.name,logo:data.settings.logo||''};authError='';loadDraft();
    draftLogo=brand.logo;
    if(!owner()&&settingsTab!=='bisnis')settingsTab='bisnis';
    render();
   }catch(e){
    if(id!==refreshId)return;data=null;close();currentSale=null;$('#print').innerHTML='';authError=e.message;render();
   }
  }
  function nav(m){
   if(!allowed(m))return;selectMenu();page=m;mg.search='';draftLogo=data.settings.logo||'';
   if(location.hash!=='#'+m)location.hash=m;render();
  }
  function render(){
   if(data&&!allowed(page))page=Object.keys(db.menus).find(allowed)||'noaccess';
   document.title=(data?db.menus[page]||'Akun':'Masuk')+' · '+(brand.name||'Bee Farma');
   $('#header').className='sitehead';
   renderNavigation(data?.me,page,brand,allowed);
   if(!data){$('#main').innerHTML=loginView('',brand.name,brand.logo);if(authError){feedback(authError,'error');authError=''}return}
   $('#main').innerHTML=page==='kasir'?pos():page==='pengaturan'?settingsView(data,settingsTab,draftLogo):page==='noaccess'?empty('Belum ada menu yang diizinkan','Hubungi pemilik untuk mengatur akses akun Anda.'):management(page,data);
  }
  function signOut(){
   db.logout();close();data=null;authError='';cartKey='';currentSale=null;cart={};pending=false;settingsTab='bisnis';
   page='kasir';if(location.hash)history.replaceState(null,'',location.pathname+location.search);
   return refresh();
  }
  function pos(){
   const dt='<div class="date">'+icon('calendar',18)+date(Date.now(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</div>';
   return head('Kasir','Pilih produk untuk memulai transaksi penjualan.',dt)+'<div class="pos"><section class="catalog"><div class="toolsrow">'+search('catalogsearch',query,'Cari produk atau SKU…')+btn('filter','Filter','filter',sort!=='default'||available?'dark':'')+'</div><div class="chips" aria-label="Kategori produk">'+['Semua',...new Set([...db.categories,...data.products.map(p=>p.category)])].map(c=>'<button class="chip '+(category===c?'on':'')+'" data-a="category" data-id="'+h(c)+'" aria-pressed="'+(c===category)+'">'+(c==='Semua'?icon('grid',15):'')+h(c)+'</button>').join('')+'</div><div id="cataloglist">'+catalogList()+'</div></section><aside id="cart" class="cartpanel">'+cartView()+'</aside></div><div id="mobilecart">'+mobileCart()+'</div>';
  }
  let catalogTimer;
  function catalogSkeleton(){
   const q=query.toLowerCase().trim(),count=data.products.filter(p=>(category==='Semua'||category===p.category)&&(!available||p.stock>0)&&[p.name,p.sku,p.detail].join(' ').toLowerCase().includes(q)).length;
   const card='<div class="card"><i class="sk sk-photo"></i><div class="cardbody"><i class="sk sk-line w40"></i><i class="sk sk-line w80"></i><i class="sk sk-line w60"></i></div></div>';
   return '<div class="sectionline"><h2>Katalog produk</h2><i class="sk sk-line w15"></i></div><div class="products">'+card.repeat(Math.min(6,count||2))+'</div>';
  }
  function catalogSwap(){
   const box=$('#cataloglist');if(!box||!data)return;
   clearTimeout(catalogTimer);
   box.innerHTML=catalogSkeleton();box.setAttribute('aria-busy','true');
   catalogTimer=setTimeout(()=>{const now=$('#cataloglist');if(now&&data){now.innerHTML=catalogList();now.removeAttribute('aria-busy')}},400);
  }
  function catalogList(){
   let q=query.toLowerCase().trim(),products=data.products.filter(p=>(category==='Semua'||category===p.category)&&(!available||p.stock>0)&&[p.name,p.sku,p.detail].join(' ').toLowerCase().includes(q));
   if(sort==='low')products.sort((a,b)=>a.price-b.price);if(sort==='high')products.sort((a,b)=>b.price-a.price);if(sort==='name')products.sort((a,b)=>a.name.localeCompare(b.name,'id'));
   return '<div class="sectionline"><h2>Katalog produk</h2><span>'+products.length+' produk</span></div><div class="products">'+(products.map(p=>'<article class="card"><button class="photo" data-a="add" data-id="'+h(p.id)+'" aria-label="Tambah '+h(p.name)+'" '+(!p.stock?'disabled':'')+'>'+photo(p)+'</button><div class="cardbody"><span class="tag">'+h(p.category)+'</span><h3>'+h(p.name)+'</h3><span class="productdesc">'+h(p.detail||p.sku)+'</span><div class="cardbottom"><div><span class="price">'+rp(p.price)+'</span> <span class="unit">/ '+h(p.unit.toLowerCase())+'</span></div><div class="addcol"><span class="stocktag '+(p.stock===0?'zero':p.stock<=p.minimum?'low':'')+'" data-sid="'+h(p.id)+'">Stok <span class="stocknum">'+p.stock+'</span></span><button class="square" type="button" data-a="add" data-id="'+h(p.id)+'" aria-label="Tambahkan '+h(p.name)+' ke keranjang" '+(!p.stock?'disabled':'')+'>'+icon('plus',17)+'</button></div></div></div></article>').join('')||empty('Produk tidak ditemukan',data.products.length?'Coba kata kunci atau kategori lain.':'Tambahkan produk melalui menu Stok.'))+'</div>';
  }
  function cartView(){const {qty,sub,total,lines}=totals();
   return '<div class="boxhead"><div class="boxname"><span class="boxicon logo"><img alt="" src="'+h(logoUrl(brand.logo)||'icon.svg')+'"></span><h2>Keranjang</h2></div><span class="count">'+qty+' item</span></div>'+(qty?'<div class="cartitems">'+lines.map(({p,qty})=>'<div class="cartitem" data-pid="'+h(p.id)+'"><span class="thumb">'+photo(p)+'</span><div class="carttext"><b>'+h(p.name)+'</b><small>'+rp(p.price)+' / '+h(p.unit.toLowerCase())+'</small><div class="qty">'+ib('minus','Kurangi '+p.name,'minus',p.id,'')+'<span>'+qty+'</span>'+ib('add','Tambah '+p.name,'plus',p.id,'')+'</div></div>'+ib('remove','Hapus '+p.name,'trash',p.id)+'</div>').join('')+'</div>':'<div class="emptycart"><div class="receipt-art" aria-hidden="true"><span class="paper"><i></i><i></i><i></i></span><b>+</b></div><strong>Keranjang masih kosong</strong><p>Pilih produk dari katalog untuk menambahkannya ke sini.</p></div>')+'<div class="summary">'+line('Subtotal',rp(sub))+'<div class="line"><span>Diskon</span><button class="linkbtn" data-a="discount" '+(!qty?'disabled':'')+' aria-label="Atur diskon">'+(discount?'− '+rp(discount):rp(0))+(qty?' '+icon('edit',12):'')+'</button></div><div class="line total"><span>Total pembayaran</span><strong>'+rp(total)+'</strong></div><button class="btn primary full" data-a="pay" '+(!qty?'disabled':'')+'>'+icon('wallet',18)+' Bayar'+(qty?' '+rp(total):'')+'</button></div>';
  }
  const mobileCart=()=>totals().qty?btn('jumpcart','Keranjang · '+rp(totals().total),'bag','primary floatcart'):'';
  function updateCart(){saveDraft();$('#cart').innerHTML=cartView();$('#mobilecart').innerHTML=mobileCart()}
  function cartFx(button,id,isNew){
   const card=button.closest('.card'),sq=card?.querySelector('.square'),img=card?.querySelector('.photo img');
   if(sq){const old=sq.innerHTML;sq.innerHTML=icon('check',17);sq.classList.add('ok');setTimeout(()=>{if(sq.isConnected){sq.innerHTML=old;sq.classList.remove('ok')}},800)}
   const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const row=[...document.querySelectorAll('#cart .cartitem')].find(r=>r.dataset.pid===id);
   const list=$('#cart .cartitems');
   if(isNew&&list)list.scrollTop=list.scrollHeight;
   const inView=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight};
   const mobile=$('#mobilecart .floatcart');
   const rowTarget=row&&inView(row)?row:null;
   const target=rowTarget?(row.querySelector('.thumb')||row):(mobile&&mobile.getClientRects().length?mobile:null);
   // munculkan baris keranjang: item baru "membuka", item lama berkedip
   const reveal=()=>{
    if(!row||reduce)return;
    if(isNew)row.animate([{opacity:0,transform:'translateY(-14px) scale(.9)',clipPath:'inset(0 0 100% 0)',backgroundColor:'#fff2e9'},{opacity:1,transform:'translateY(0) scale(1.03)',clipPath:'inset(0 0 0 0)',backgroundColor:'#fff2e9',offset:.6},{opacity:1,transform:'scale(1)',clipPath:'inset(0 0 0 0)',backgroundColor:'rgba(255,242,233,0)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
    else row.animate([{backgroundColor:'#fff2e9'},{backgroundColor:'rgba(255,242,233,0)'}],{duration:600,easing:'ease-out'});
    const q=row.querySelector('.qty span');q?.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:340,easing:'ease-out'});
   };
   if(!target||reduce){reveal();return}
   if(isNew&&row&&rowTarget)row.style.opacity='0';
   const from=(sq||button).getBoundingClientRect(),to=target.getBoundingClientRect(),size=rowTarget?42:30,dot=document.createElement('span');
   dot.className='flydot';dot.style.width=dot.style.height=size+'px';if(img)dot.style.backgroundImage='url("'+img.src+'")';
   dot.style.left=from.left+from.width/2-size/2+'px';dot.style.top=from.top+from.height/2-size/2+'px';
   document.body.append(dot);
   const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2);
   const end=rowTarget?.9:.35;
   const anim=dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.45+'px,'+(dy*.45-70)+'px) scale(1)',opacity:1,offset:.45},{transform:'translate('+dx+'px,'+dy+'px) scale('+end+')',opacity:rowTarget?1:.55}],{duration:700,easing:'cubic-bezier(.45,.05,.4,1)'});
   anim.onfinish=()=>{dot.remove();if(row)row.style.opacity='';reveal();if(!rowTarget)for(const el of [mobile,$('#cart .count')])el?.animate([{transform:'scale(1)'},{transform:'scale(1.28)'},{transform:'scale(1)'}],{duration:320,easing:'ease-out'})};
  }
  // animasi hapus: foto produk masuk ke tong sampah, lalu baris menutup
  function trashFx(row){
   return new Promise(resolve=>{
    const bin=row?.querySelector('[data-a="remove"],[data-a="deleteproduct"]'),thumb=row?.querySelector('.thumb');
    if(!row||!bin||!thumb||matchMedia('(prefers-reduced-motion: reduce)').matches||!row.getClientRects().length){resolve();return}
    const img=thumb.querySelector('img'),from=thumb.getBoundingClientRect(),to=bin.getBoundingClientRect(),size=Math.min(42,Math.max(28,from.width));
    const dot=document.createElement('span');dot.className='flydot';dot.style.width=dot.style.height=size+'px';dot.style.borderRadius='10px';
    dot.style.background=img?'#fff center/cover no-repeat':'#eeece9';if(img)dot.style.backgroundImage='url("'+img.src+'")';
    dot.style.left=from.left+from.width/2-size/2+'px';dot.style.top=from.top+from.height/2-size/2+'px';
    document.body.append(dot);thumb.style.visibility='hidden';
    row.animate([{opacity:1},{opacity:.45}],{duration:300,fill:'forwards'});
    const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2);
    bin.animate([{transform:'rotate(0)'},{transform:'rotate(-16deg) scale(1.25)',offset:.35},{transform:'rotate(12deg) scale(1.25)',offset:.6},{transform:'rotate(0) scale(1)'}],{duration:640,delay:240,easing:'ease-in-out'});
    bin.animate([{color:'inherit'},{color:'#d64545',offset:.4},{color:'inherit'}],{duration:760,delay:200});
    const fly=dot.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:'translate('+dx*.5+'px,'+(dy*.5-34)+'px) scale(.8) rotate(100deg)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.12) rotate(300deg)',opacity:.2}],{duration:560,easing:'cubic-bezier(.5,0,.75,.4)'});
    fly.onfinish=()=>{
     dot.remove();
     const h0=row.offsetHeight;row.style.overflow='hidden';
     const out=row.tagName==='TR'?row.animate([{opacity:.45,transform:'translateX(0)'},{opacity:0,transform:'translateX(-24px)'}],{duration:260,fill:'forwards'}):row.animate([{height:h0+'px',opacity:.45},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px'}],{duration:280,easing:'ease-in',fill:'forwards'});
     out.onfinish=resolve;
    };
   });
  }
  function changeQty(id,mode){const p=product(id);if(pending){feedback('Selesaikan pemeriksaan pembayaran sebelumnya.','error');return}let n=mode==='remove'?0:(cart[id]||0)+(mode==='add'?1:-1);if(n>p.stock){feedback('Jumlah melebihi stok yang tersedia.','error');return}if(n<=0)delete cart[id];else cart[id]=n;discount=Math.min(discount,totals().sub);updateCart()}
  function payment(){const {sub,total,qty}=totals();if(!qty)return;
   if(pending){const prev=JSON.parse(sessionStorage.getItem(cartKey+'.payment')||'null');if(prev){modal('Periksa pembayaran','<p class="note">Pembayaran sebelumnya belum terkonfirmasi. Tekan periksa untuk mengambil struk atau menyelesaikan transaksi dengan nomor yang sama.</p>'+btn('retry','Periksa transaksi','receipt','primary')+'<p class="error"></p>');return}}
   modal('Pembayaran','<form id="paymentform">'+line('Jumlah produk',qty+' item')+line('Subtotal',rp(sub))+line('Diskon',rp(discount))+'<div class="line total"><span>Total pembayaran</span><strong>'+rp(total)+'</strong></div><div class="formgrid">'+field('Metode pembayaran','method','Tunai',{items:['Tunai','QRIS','Debit','Transfer'],wide:true})+field('Uang diterima (Rp)','paid',total,{type:'number',required:true,min:total,wide:true,extra:'step="1"'})+'</div><div class="sectiongap" id="change">'+line('Kembalian',rp(0))+'</div>'+formEnd('Selesaikan pembayaran')+'</form>');
  }
  function showReceipt(s){currentSale=s;modal('Struk penjualan',ticket(s)+'<div class="actions">'+btn('close','Tutup')+btn('print','Cetak struk','print','primary')+'</div>')}
  async function doPrint(){
   document.documentElement.style.setProperty('--paper',currentSale.business.width==='58'?'58mm':'80mm');
   const printArea=$('#print');printArea.innerHTML=ticket(currentSale);
   await Promise.allSettled(Array.from(printArea.querySelectorAll('img'),img=>img.decode()));
   window.print();
  }
  function account(){const m=data.me;modal('Akun pengguna',line('Nama',m.name)+line('Peran',m.owner?'Pemilik':'Pegawai')+line('Penyimpanan',db.config()?'Database online':'Hanya di perangkat ini')+'<div class="actions">'+(allowed('pengaturan')?btn('opensettings','Pengaturan','pengaturan'):'')+btn('logout','Keluar akun')+'</div>')}
  function edit(kind,id){
   const [key,label,form]={product:['products','produk',productForm],supplier:['suppliers','suplier',supplierForm],employee:['staff','pegawai',employeeForm]}[kind];
   if(kind==='employee'&&!owner())return;
   editing=id?data[key].find(x=>x.id===id):null;
   if(kind==='employee')employeeDraftId=editing?.id||db.uuid();
   modal((editing?'Edit ':'Tambah ')+label,form(editing||undefined,data));
  }
  async function readPhoto(file){if(!file?.size)return editing?.image||'';if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('Pilih JPG, PNG, atau WebP maksimal 12 MB.');
   const bitmap=await createImageBitmap(file),scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));let canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));let ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.82);
  }
  const confirmForms={
   businessform:['Simpan perubahan?','Identitas apotek dan isi struk akan diperbarui.','Simpan','check'],
   configform:['Simpan koneksi database?','Koneksi baru akan dipakai dan Anda perlu masuk kembali.','Simpan','database'],
   employeeform:['Simpan akun?','Data akun login ini akan disimpan.','Simpan','check'],
   passwordform:['Simpan kata sandi?','Kata sandi akun ini akan diganti.','Simpan','lock'],
   productform:()=>editing?['Simpan perubahan produk?','Nama, harga, dan stok produk ini akan diperbarui.','Simpan','check']:['Tambah produk baru?','Produk baru akan ditambahkan ke daftar stok.','Tambah','plus'],
   supplierform:()=>editing?['Simpan perubahan suplier?','Data suplier ini akan diperbarui.','Simpan','check']:['Tambah suplier baru?','Suplier baru akan ditambahkan ke daftar.','Tambah','plus'],
   discountform:['Terapkan diskon?','Potongan harga akan dikurangkan dari total pembayaran.','Terapkan','check'],
   ownerform:['Buat akun pemilik?','Akun ini akan dipakai untuk masuk dan mengelola data apotek.','Buat akun','user']
  };
  let askOpen=null;
  function askConfirm(title,text,okLabel='Ya',iconName='check'){
   if(askOpen)return askOpen;
   askOpen=new Promise(resolve=>{
    const d=document.createElement('dialog');d.className='askdlg';
    d.innerHTML='<span class="askicon">'+icon(iconName,26)+'</span><h2>'+h(title)+'</h2><p>'+h(text)+'</p><div class="actions"><button type="button" class="btn" data-ask="no">Batal</button><button type="button" class="btn dark" data-ask="yes">'+h(okLabel)+'</button></div>';
    let done=false;
    const finish=v=>{if(done)return;done=true;d.classList.add('closing');setTimeout(()=>{d.close();d.remove();askOpen=null;resolve(v)},170)};
    d.addEventListener('click',e=>{const b=e.target.closest('[data-ask]');if(b)finish(b.dataset.ask==='yes');else if(e.target===d)finish(false)});
    d.addEventListener('cancel',e=>{e.preventDefault();finish(false)});
    document.body.append(d);d.showModal();d.querySelector('[data-ask="yes"]').focus();
   });
   return askOpen;
  }
  function askRemove(id){const p=product(id);modal('Hapus dari keranjang','<p class="note">Hapus <b>'+h(p.name)+'</b> dari keranjang?</p><div class="actions">'+btn('close','Batal')+btn('confirmremove','Hapus','trash','dark',id)+'</div>')}
  let pendingPay=null;
  function doneFx(total){
   return new Promise(resolve=>{
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,o=document.createElement('div');
    o.className='donefx';o.setAttribute('role','status');
    o.innerHTML='<div class="donebox"><div class="donering"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="dc" cx="26" cy="26" r="23"/><path class="dp" d="M15 27l8 8 15-17"/></svg>'+Array.from({length:12},(_,n)=>'<i style="--a:'+n*30+'deg"></i>').join('')+'</div><strong>Pembayaran selesai</strong><span>'+rp(total)+'</span></div>';
    document.body.append(o);
    setTimeout(()=>{o.classList.add('out');setTimeout(()=>{o.remove();resolve()},300)},reduce?700:2000);
   });
  }
  function stockFx(before,delay=0){
   const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
   document.querySelectorAll('[data-sid]').forEach(el=>{
    const num=el.querySelector('.stocknum'),from=before[el.dataset.sid],to=Number(num.textContent);
    if(from===undefined||from<=to||reduce)return;
    const badge=document.createElement('span');badge.className='stockminus';badge.textContent='−'+(from-to);setTimeout(()=>{el.append(badge);setTimeout(()=>badge.remove(),1300)},delay);
    el.classList.add('dec');num.textContent=from;
    const start=performance.now()+delay,dur=Math.min(1100,450+(from-to)*60);
    const step=t=>{const k=Math.max(0,Math.min(1,(t-start)/dur));num.textContent=Math.round(from-(from-to)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);else{num.textContent=to;setTimeout(()=>el.classList.remove('dec'),350)}};
    requestAnimationFrame(step);
   });
  }
  async function finishPayment(payload){
   pending=true;sessionStorage.setItem(cartKey+'.payment',JSON.stringify(payload));saveDraft();
   const before=Object.fromEntries((data?.products||[]).map(p=>[p.id,p.stock]));
   try{const s=await db.checkout(payload.id,payload.items,payload.discount,payload.paid,payload.method);resetDraft();sessionStorage.removeItem(cartKey+'.payment');await refresh();close();stockFx(before,1700);await doneFx(s.total);feedback('Pembayaran berhasil.');showReceipt(s)}
   catch(e){if(!/jaringan|fetch|network|timeout|502|503|504/i.test(e.message)){pending=false;saveDraft();sessionStorage.removeItem(cartKey+'.payment')}throw e}
  }
  function err(e,form){if(form?.id==='loginform'){feedback(e.message,'error');return}let el=form?.querySelector('.error')||(dlg.open?dlg.querySelector('.error'):null);if(el)el.textContent=e.message;else feedback(e.message,'error')}
  document.addEventListener('click',e=>{
   const t=e.target.closest('.pwtoggle');if(!t)return;
   const input=t.parentElement.querySelector('input'),show=input.type==='password';
   input.type=show?'text':'password';t.classList.toggle('on',show);t.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');
  });
  document.addEventListener('click',async e=>{
   const button=e.target.closest('[data-a]');if(!button||button.disabled||busy)return;const a=button.dataset.a,id=button.dataset.id;
   if(['confirmdelete','test','retry','confirmpay'].includes(a))button.classList.add('loading');
   try{switch(a){
   case 'togglemenu':toggleMenu();break;case 'closemenu':closeMenu();break;case 'togglegroup':button.closest('.snav-group').classList.toggle('collapsed');button.setAttribute('aria-expanded',String(!button.closest('.snav-group').classList.contains('collapsed')));break;
   case 'setup-owner':if(!data&&db.needsOwner())modal('Siapkan akun pemilik demo',ownerForm());break;
   case 'password':if(owner()){
    editing=data.staff.find(s=>s.id===id);if(editing)modal('Atur kata sandi',passwordForm(editing));
   }break;
   case 'clearlogo':{if(!await askConfirm('Hapus logo?','Logo akan dilepas dari website dan struk setelah pengaturan disimpan.','Hapus','trash'))break;const f=$('#businessform');if(f){draftLogo='';f.elements.logoFile.value='';updateLogoTile('');$('#receipt-preview').innerHTML=receiptPreview(receiptValues(f,''))}break}
   case 'nav':nav(id);break;case 'home':if(data)nav(Object.keys(db.menus).find(allowed));break;
   case 'account':selectMenu();account();break;case 'close':close();break;
   case 'category':category=id;render();catalogSwap();break;case 'add':case 'minus':{if(a==='minus'&&cart[id]===1&&!pending&&product(id)){askRemove(id);break}const before=totals().qty,had=(cart[id]||0)>0;changeQty(id,a);if(a==='add'&&button.closest('.card')&&totals().qty>before)cartFx(button,id,!had);break}
   case 'remove':{if(pending||!product(id)){changeQty(id,a);break}askRemove(id);break}
   case 'confirmpay':busy=true;await finishPayment(pendingPay);break;
   case 'confirmremove':{close();if(!pending){busy=true;await trashFx([...document.querySelectorAll('#cart .cartitem')].find(r=>r.dataset.pid===id))}changeQty(id,'remove');if(!cart[id])feedback('Produk dihapus dari keranjang.');break}
   case 'jumpcart':$('#cart').scrollIntoView({behavior:'smooth'});break;
   case 'filter':modal('Filter produk','<form id="filterform"><div class="stack">'+field('Urutkan produk','sort',sort,{items:[['default','Urutan katalog'],['name','Nama A–Z'],['low','Harga terendah'],['high','Harga tertinggi']]})+'<label class="checkline"><input type="checkbox" name="available" '+(available?'checked':'')+'>Hanya produk dengan stok tersedia</label></div>'+formEnd('Terapkan filter')+'</form>');break;
   case 'discount':if(!pending)modal('Diskon transaksi','<form id="discountform">'+field('Potongan harga (Rp)','discount',discount,{type:'number',required:true,min:0,extra:'step="1" max="'+totals().sub+'"'})+formEnd('Terapkan diskon')+'</form>');break;
   case 'pay':payment();break;case 'retry':busy=true;await finishPayment(JSON.parse(sessionStorage.getItem(cartKey+'.payment')));break;
   case 'receipt':showReceipt(data.sales.find(s=>s.id===id));break;case 'print':if(await askConfirm('Cetak struk?','Struk akan dikirim ke dialog cetak browser.','Cetak','print')){busy=true;await doPrint()}break;
   case 'deleteproduct':{const p=data.products.find(x=>x.id===id);if(p)modal('Hapus produk','<p class="note">Produk <b>'+h(p.name)+'</b> akan dihapus permanen dari daftar stok. Riwayat transaksi yang sudah ada tidak berubah.</p><p class="error" role="alert"></p><div class="actions">'+btn('close','Batal')+btn('confirmdelete','Hapus','trash','dark',p.id)+'</div>');break}
   case 'confirmdelete':{const p=data.products.find(x=>x.id===id);if(!p)break;busy=true;await db.remove('products',p.id,p.rev);close();await trashFx([...document.querySelectorAll('#mgrows tr')].find(r=>r.querySelector('[data-a="deleteproduct"]')?.dataset.id===p.id));await refresh();feedback('Produk dihapus.');break}
   case 'product':case 'supplier':case 'employee':edit(a,id);break;
   case 'contact':{let s=data.suppliers.find(s=>s.id===id);modal(s.name,contact(s,data.products)+(allowed('suplier')?'<div class="actions">'+btn('supplier','Edit suplier','edit','',s.id)+'</div>':''));break}
   case 'export':modal('Ekspor laporan',exportChooser());break;case 'export-csv':if(await askConfirm('Ekspor laporan CSV?','File CSV akan diunduh sesuai periode yang dipilih.','Ekspor','download')){exportCsv(data);close()}break;case 'export-pdf':if(await askConfirm('Ekspor laporan PDF?','File PDF akan diunduh sesuai periode yang dipilih.','Ekspor','download')){exportPdf(data);close()}break;case 'tab':settingsTab=id;draftLogo=data.settings.logo||'';mg.search='';render();break;case 'opensettings':close();nav('pengaturan');break;
   case 'connection':if(owner()||!db.config())modal('Pengaturan database',connectionView());break;
   case 'test':{let f=button.closest('form');if(!f.reportValidity())return;busy=true;button.disabled=true;let v=asForm(f);await db.testConfig(db.parseConfig(v.url,v.key));f.querySelector('.error').textContent='';feedback('Koneksi, skema database, dan fungsi login siap.');break}
   case 'copycfg':{const t=$('#cfgcode');if(t){try{await navigator.clipboard.writeText(t.value)}catch{t.select();document.execCommand('copy')}feedback('Kode disalin.')}break}
   case 'logout':if(await askConfirm('Keluar dari akun?','Anda perlu masuk lagi untuk memakai aplikasi.','Keluar','user'))await signOut();break;
   case 'disconnect':if(owner()&&await askConfirm('Putuskan database?','Aplikasi akan kembali ke mode demo dan Anda keluar dari akun.','Putuskan','database')){db.disconnect();brand={name:'Bee Farma',logo:''};await signOut()}break;
   }}catch(ex){err(ex,button.closest('form'))}finally{busy=false;button.classList.remove('loading');if(a==='test')button.disabled=false}
  });
  document.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;const form=e.target,v=asForm(form),fd=new FormData(form),submit=e.submitter,b=form.id;if(confirmForms[b]){busy=true;const cf=typeof confirmForms[b]==='function'?confirmForms[b]():confirmForms[b];const ok=await askConfirm(...cf);busy=false;if(!ok)return}busy=true;if(submit){submit.disabled=true;submit.classList.add('loading')}let error=form.querySelector('.error');if(error)error.textContent='';
   try{
   if(b==='filterform'){sort=v.sort;available=fd.has('available');close();render();if(page==='kasir')catalogSwap();return}
   if(b==='discountform'){discount=Number(v.discount);close();updateCart();return}
   if(b==='paymentform'){const {total}=totals(),paid=Number(v.paid);pendingPay={id:orderId,items:totals().lines.map(({p,qty})=>({id:p.id,qty,price:p.price})),discount,paid,method:v.method};modal('Selesaikan pembayaran?','<p class="note">Pastikan pesanan dan nominal sudah benar sebelum menyelesaikan pembayaran.</p>'+line('Metode',v.method)+line('Total pembayaran',rp(total))+line('Uang diterima',rp(paid))+line('Kembalian',rp(paid-total))+'<p class="error" role="alert"></p><div class="actions">'+btn('pay','Kembali')+btn('confirmpay','Selesaikan','check','dark')+'</div>');return}
   if(b==='ownerform'){await db.setupDemoOwner(v,v.password);close();cartKey='';await refresh();return}
   if(b==='loginform'){await db.login(v.identifier,v.password);cartKey='';authError='';await refresh();feedback('Berhasil masuk.');return}
   if(b==='passwordform'){await db.setPassword(editing.id,v.password);close();await refresh();feedback('Kata sandi disimpan.');return}
   if(b==='configform'){await db.connect(db.parseConfig(v.url,v.key));authError='';cartKey='';close();await refresh();feedback('Database terhubung. Masuk dengan akun pemilik database.');return}
   if(b==='businessform'){
    if(logoTask)await logoTask;
    const values=receiptValues(form,draftLogo);if(!values.name)throw Error('Isi nama apotek.');
    await db.save('settings',data.settings.id,data.settings.rev,values);
   }
   else{let kind={productform:'products',supplierform:'suppliers',employeeform:'staff'}[b];if(!kind)return;
   if(b==='productform'){v.image=await readPhoto(fd.get('upload'));delete v.upload;for(let n of ['stock','minimum','cost','price'])v[n]=Number(v[n]);v.sku=v.sku.trim();if(!v.sku||!v.unit.trim())throw Error('Isi SKU dan satuan penjualan.')}
   if(!v.name.trim())throw Error('Nama wajib diisi.');
   if(b==='employeeform'){
    if(!owner())throw Error('Hanya pemilik yang dapat mengatur akun.');
    const {password,...profile}=v;
    if(password&&new TextEncoder().encode(password).length>72)throw Error('Kata sandi maksimal 72 byte.');
    profile.menus=fd.getAll('menus');profile.active=fd.has('active');
    await db.save(kind,employeeDraftId,editing?.rev||0,profile);
    if(password){
     try{await db.setPassword(employeeDraftId,password)}
     catch(e){await refresh();editing=data?.staff.find(s=>s.id===employeeDraftId);
      if(editing)modal('Selesaikan aktivasi akun',passwordForm(editing,'Profil sudah tersimpan. '+e.message));
      else feedback(e.message,'error');return;
     }
    }
   }else await db.save(kind,editing?.id||db.uuid(),editing?.rev||0,v);
   close()}
   await refresh();feedback('Perubahan disimpan.');
   }catch(ex){err(ex,form)}finally{busy=false;if(submit){submit.disabled=false;submit.classList.remove('loading')}}
  });
  document.addEventListener('input',e=>{let t=e.target;if(t.id==='catalogsearch'){query=t.value;catalogSwap()}
   if(t.id==='mgsearch'){mg.search=t.value;$('#mgrows').innerHTML=managementRows(page==='pengaturan'?'pegawai':page,data)}
   if(t.form?.id==='businessform'&&t.name!=='logoFile')$('#receipt-preview').innerHTML=receiptPreview(receiptValues(t.form,draftLogo));
   if(t.name==='paid'&&$('#change'))$('#change').innerHTML=line('Kembalian',rp(Math.max(0,t.value-totals().total)));});
  document.addEventListener('change',async e=>{let t=e.target;
   if(t.name==='logoFile'&&t.files[0]){
    const form=t.form,file=t.files[0];const task=resizeLogo(file);logoTask=task;
    try{const next=await task;if(logoTask===task&&form.isConnected&&t.files[0]===file){
     draftLogo=next;updateLogoTile(next);$('#receipt-preview').innerHTML=receiptPreview(receiptValues(form,next));form.querySelector('.error').textContent='';
    }}catch(error){t.value='';err(error,form)}finally{if(logoTask===task)logoTask=null}return;
   }
   if(t.name==='period'){mg.period=t.value;render()}
   if(t.name==='method'){let paid=t.form.elements.paid;paid.value=totals().total;paid.readOnly=t.value!=='Tunai';$('#change').innerHTML=line('Kembalian',rp(0))}});
  document.addEventListener('dp-range',e=>{Object.assign(mg,e.detail);if(data&&page==='laporan')render()});
  window.addEventListener('hashchange',()=>{let m=location.hash.slice(1);if(allowed(m)){page=m;render()}});
  window.addEventListener('storage',e=>{
   if(e.key==='figiha.supabase'){db.logout();cartKey='';authError='';refresh();return}
   if(!db.config()&&e.key==='figiha.demo.v1'){if(!data||!dlg.open)refresh();else db.state().then(s=>{if(!s.me.owner&&(!s.me.menus.includes(page)||page==='pegawai')){close();refresh()}}).catch(()=>refresh())}
  });
  document.addEventListener('keydown',e=>{if(dlg.open||document.body.classList.contains('side-modal')||page!=='kasir'||!data)return;if(e.key==='F2'){e.preventDefault();$('#catalogsearch').focus()}if(e.key==='F8'){e.preventDefault();payment()}});
  dlg.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
  dlg.addEventListener('close',()=>{if(!dlg.open){dlg.replaceChildren();editing=null}});
  if(db.session())preload();
  refresh();
})();
