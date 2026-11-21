(() => {
  const db = ApotekData;
  const {h,rp,date,nomor,head,btn,ib,field,icon,line,ticket,photo,search,empty,formEnd} = ApotekUI;
  const {management,managementRows,productForm,supplierForm,employeeForm,contact,exportCsv,mg} = ApotekManagement;
  const {connectionView,loginView,ownerForm,passwordForm,settingsView,receiptValues,receiptPreview,resizeLogo,updateLogoTile} = ApotekSettings;
  const {renderNavigation,selectMenu,toggleMenu,closeMenu} = ApotekNavigation;
  const $=s=>document.querySelector(s),dlg=$('#dialog');
  let data,page=location.hash.slice(1)||'kasir',query='',category='Semua',sort='default',available=false,cart={},discount=0,cartKey='',orderId='',settingsTab='bisnis',editing=null,currentSale=null,authError='',pending=false,timer,busy=false;
  let brand={name:'Apotek Figiha',logo:''},draftLogo='',refreshId=0,employeeDraftId='',logoTask=null;
  const owner=()=>Boolean(data?.me?.owner);
  const allowed=m=>Boolean(data&&Object.hasOwn(db.menus,m)&&(owner()||m!=='pegawai'&&data.me.menus.includes(m)));
  const product=id=>data.products.find(p=>p.id===id);
  const asForm=form=>Object.fromEntries(new FormData(form));
  const feedback=msg=>{let t=$('#toast');t.textContent=msg;clearTimeout(timer);timer=setTimeout(()=>t.textContent='',3300)};
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
  async function refresh(){
   const id=++refreshId;
   if(!db.session()){
    data=null;currentSale=null;$('#print').innerHTML='';close();render();
    try{const publicBrand=await db.branding();if(id===refreshId&&publicBrand){brand=publicBrand;renderNavigation(null,page,brand,allowed);document.title='Masuk · '+brand.name}}
    catch{/* Petunjuk koneksi tetap tersedia ketika perangkat luring. */}
    return;
   }
   try{
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
   document.title=(data?db.menus[page]||'Akun':'Masuk')+' · '+(brand.name||'Apotek Figiha');
   $('#header').className='sitehead';
   renderNavigation(data?.me,page,brand,allowed);
   if(!data){$('#main').innerHTML=loginView(authError);return}
   $('#main').innerHTML=page==='kasir'?pos():page==='pengaturan'?settingsView(data,settingsTab,draftLogo):page==='noaccess'?empty('Belum ada menu yang diizinkan','Hubungi pemilik untuk mengatur akses akun Anda.'):management(page,data);
  }
  function signOut(){
   db.logout();close();data=null;authError='';cartKey='';currentSale=null;cart={};pending=false;settingsTab='bisnis';
   page='kasir';if(location.hash)history.replaceState(null,'',location.pathname+location.search);
   return refresh();
  }
  function pos(){
   const dt='<div class="date">'+icon('calendar',18)+date(Date.now(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</div>';
   return head('Kasir','Pilih produk untuk memulai transaksi penjualan.',dt)+'<div class="pos"><section class="catalog"><div class="toolsrow">'+search('catalogsearch',query,'Cari nama produk atau kode SKU…')+btn('filter','Filter','filter',sort!=='default'||available?'dark':'')+'</div><div class="chips" aria-label="Kategori produk">'+['Semua',...new Set([...db.categories,...data.products.map(p=>p.category)])].map(c=>'<button class="chip '+(category===c?'on':'')+'" data-a="category" data-id="'+h(c)+'" aria-pressed="'+(c===category)+'">'+(c==='Semua'?icon('grid',15):'')+h(c)+'</button>').join('')+'</div><div id="cataloglist">'+catalogList()+'</div></section><aside id="cart" class="cartpanel">'+cartView()+'</aside></div><div id="mobilecart">'+mobileCart()+'</div>';
  }
  function catalogList(){
   let q=query.toLowerCase().trim(),products=data.products.filter(p=>(category==='Semua'||category===p.category)&&(!available||p.stock>0)&&[p.name,p.sku,p.detail].join(' ').toLowerCase().includes(q));
   if(sort==='low')products.sort((a,b)=>a.price-b.price);if(sort==='high')products.sort((a,b)=>b.price-a.price);if(sort==='name')products.sort((a,b)=>a.name.localeCompare(b.name,'id'));
   return '<div class="sectionline"><h2>Katalog produk</h2><span>'+products.length+' produk</span></div><div class="products">'+(products.map(p=>'<article class="card"><button class="photo" data-a="add" data-id="'+h(p.id)+'" aria-label="Tambah '+h(p.name)+'" '+(!p.stock?'disabled':'')+'>'+photo(p)+'<span class="stocktag '+(p.stock===0?'zero':p.stock<=p.minimum?'low':'')+'">Stok '+p.stock+'</span></button><div class="cardbody"><span class="tag">'+h(p.category)+'</span><h3>'+h(p.name)+'</h3><span class="productdesc">'+h(p.detail||p.sku)+'</span><div class="cardbottom"><div><span class="price">'+rp(p.price)+'</span> <span class="unit">/ '+h(p.unit.toLowerCase())+'</span></div><button class="square" type="button" data-a="add" data-id="'+h(p.id)+'" aria-label="Tambahkan '+h(p.name)+' ke keranjang" '+(!p.stock?'disabled':'')+'>'+icon('plus',17)+'</button></div></div></article>').join('')||empty('Produk tidak ditemukan',data.products.length?'Coba kata kunci atau kategori lain.':'Tambahkan produk melalui menu Stok.'))+'</div>';
  }
  function cartView(){const {qty,sub,total,lines}=totals();
   return '<div class="boxhead"><div class="boxname"><span class="boxicon">'+icon('bag',19)+'</span><h2>Keranjang</h2></div><span class="count">'+qty+' item</span></div>'+(qty?'<div class="cartitems">'+lines.map(({p,qty})=>'<div class="cartitem"><span class="thumb">'+photo(p)+'</span><div class="carttext"><b>'+h(p.name)+'</b><small>'+rp(p.price)+' / '+h(p.unit.toLowerCase())+'</small><div class="qty">'+ib('minus','Kurangi '+p.name,'minus',p.id,'')+'<span>'+qty+'</span>'+ib('add','Tambah '+p.name,'plus',p.id,'')+'</div></div>'+ib('remove','Hapus '+p.name,'trash',p.id)+'</div>').join('')+'</div>':'<div class="emptycart"><div class="receipt-art" aria-hidden="true"><span class="paper"><i></i><i></i><i></i></span><b>+</b></div><strong>Keranjang masih kosong</strong><p>Pilih produk dari katalog untuk menambahkannya ke sini.</p></div>')+'<div class="summary">'+line('Subtotal',rp(sub))+'<div class="line"><span>Diskon</span><button class="linkbtn" data-a="discount" '+(!qty?'disabled':'')+' aria-label="Atur diskon">'+(discount?'− '+rp(discount):rp(0))+(qty?' '+icon('edit',12):'')+'</button></div><div class="line total"><span>Total pembayaran</span><strong>'+rp(total)+'</strong></div><button class="btn primary full" data-a="pay" '+(!qty?'disabled':'')+'>'+icon('wallet',18)+' Bayar'+(qty?' '+rp(total):'')+'</button><p class="hint">'+icon(db.config()?'database':'receipt',14)+(db.config()?'Terhubung ke Supabase':'Mode demo · Tersimpan di perangkat')+'</p></div>';
  }
  const mobileCart=()=>totals().qty?btn('jumpcart','Keranjang · '+rp(totals().total),'bag','primary floatcart'):'';
  function updateCart(){saveDraft();$('#cart').innerHTML=cartView();$('#mobilecart').innerHTML=mobileCart()}
  function changeQty(id,mode){const p=product(id);if(pending){feedback('Selesaikan pemeriksaan pembayaran sebelumnya.');return}let n=mode==='remove'?0:(cart[id]||0)+(mode==='add'?1:-1);if(n>p.stock){feedback('Jumlah melebihi stok yang tersedia.');return}if(n<=0)delete cart[id];else cart[id]=n;discount=Math.min(discount,totals().sub);updateCart()}
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
  function account(){const m=data.me;modal('Akun pengguna',line('Nama',m.name)+line('Peran',m.owner?'Pemilik':'Pegawai')+line('Penyimpanan',db.config()?'Supabase':'Demo perangkat')+'<div class="actions">'+(allowed('pengaturan')?btn('opensettings','Pengaturan','pengaturan'):'')+btn('logout','Keluar akun')+'</div>')}
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
  async function finishPayment(payload){
   pending=true;sessionStorage.setItem(cartKey+'.payment',JSON.stringify(payload));saveDraft();
   try{const s=await db.checkout(payload.id,payload.items,payload.discount,payload.paid,payload.method);resetDraft();sessionStorage.removeItem(cartKey+'.payment');await refresh();showReceipt(s)}
   catch(e){if(!/jaringan|fetch|network|timeout|502|503|504/i.test(e.message)){pending=false;saveDraft();sessionStorage.removeItem(cartKey+'.payment')}throw e}
  }
  function err(e,form){let el=form?.querySelector('.error')||(dlg.open?dlg.querySelector('.error'):null);if(el)el.textContent=e.message;else feedback(e.message)}
  document.addEventListener('click',async e=>{
   const button=e.target.closest('[data-a]');if(!button||button.disabled||busy)return;const a=button.dataset.a,id=button.dataset.id;
   try{switch(a){
   case 'togglemenu':toggleMenu();break;case 'closemenu':closeMenu();break;
   case 'setup-owner':if(!data&&db.needsOwner())modal('Siapkan akun pemilik demo',ownerForm());break;
   case 'password':if(owner()){
    editing=data.staff.find(s=>s.id===id);if(editing)modal('Atur kata sandi',passwordForm(editing));
   }break;
   case 'clearlogo':{const f=$('#businessform');if(f){draftLogo='';f.elements.logoFile.value='';updateLogoTile('');$('#receipt-preview').innerHTML=receiptPreview(receiptValues(f,''))}break}
   case 'nav':nav(id);break;case 'home':if(data)nav(Object.keys(db.menus).find(allowed));break;
   case 'account':selectMenu();account();break;case 'close':close();break;
   case 'category':category=id;render();break;case 'add':case 'minus':case 'remove':changeQty(id,a);break;
   case 'jumpcart':$('#cart').scrollIntoView({behavior:'smooth'});break;
   case 'filter':modal('Filter produk','<form id="filterform"><div class="stack">'+field('Urutkan produk','sort',sort,{items:[['default','Urutan katalog'],['name','Nama A–Z'],['low','Harga terendah'],['high','Harga tertinggi']]})+'<label class="checkline"><input type="checkbox" name="available" '+(available?'checked':'')+'>Hanya produk dengan stok tersedia</label></div>'+formEnd('Terapkan filter')+'</form>');break;
   case 'discount':if(!pending)modal('Diskon transaksi','<form id="discountform">'+field('Potongan harga (Rp)','discount',discount,{type:'number',required:true,min:0,extra:'step="1" max="'+totals().sub+'"'})+formEnd('Terapkan diskon')+'</form>');break;
   case 'pay':payment();break;case 'retry':busy=true;await finishPayment(JSON.parse(sessionStorage.getItem(cartKey+'.payment')));break;
   case 'receipt':showReceipt(data.sales.find(s=>s.id===id));break;case 'print':busy=true;await doPrint();break;
   case 'product':case 'supplier':case 'employee':edit(a,id);break;
   case 'contact':{let s=data.suppliers.find(s=>s.id===id);modal(s.name,contact(s,data.products)+(allowed('suplier')?'<div class="actions">'+btn('supplier','Edit suplier','edit','',s.id)+'</div>':''));break}
   case 'export':exportCsv(data);break;case 'tab':settingsTab=id;draftLogo=data.settings.logo||'';mg.search='';render();break;case 'opensettings':close();nav('pengaturan');break;
   case 'connection':if(owner()||!db.config())modal('Pengaturan database',connectionView());break;
   case 'test':{let f=button.closest('form');if(!f.reportValidity())return;busy=true;button.disabled=true;let v=asForm(f);await db.testConfig(db.parseConfig(v.url,v.key));f.querySelector('.error').textContent='';feedback('Koneksi, skema database, dan fungsi login siap.');break}
   case 'logout':await signOut();break;
   case 'disconnect':if(owner()){db.disconnect();brand={name:'Apotek Figiha',logo:''};await signOut()}break;
   }}catch(ex){err(ex,button.closest('form'))}finally{busy=false;if(a==='test')button.disabled=false}
  });
  document.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;const form=e.target,v=asForm(form),fd=new FormData(form),submit=e.submitter,b=form.id;busy=true;if(submit)submit.disabled=true;let error=form.querySelector('.error');if(error)error.textContent='';
   try{
   if(b==='filterform'){sort=v.sort;available=fd.has('available');close();render();return}
   if(b==='discountform'){discount=Number(v.discount);close();updateCart();return}
   if(b==='paymentform'){await finishPayment({id:orderId,items:totals().lines.map(({p,qty})=>({id:p.id,qty,price:p.price})),discount,paid:Number(v.paid),method:v.method});return}
   if(b==='ownerform'){await db.setupDemoOwner(v,v.password);close();cartKey='';await refresh();return}
   if(b==='loginform'){await db.login(v.identifier,v.password);cartKey='';authError='';await refresh();return}
   if(b==='passwordform'){await db.setPassword(editing.id,v.password);close();await refresh();feedback('Kata sandi disimpan.');return}
   if(b==='configform'){await db.connect(db.parseConfig(v.url,v.key));authError='';cartKey='';close();await refresh();return}
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
      else feedback(e.message);return;
     }
    }
   }else await db.save(kind,editing?.id||db.uuid(),editing?.rev||0,v);
   close()}
   await refresh();feedback('Perubahan disimpan.');
   }catch(ex){err(ex,form)}finally{busy=false;if(submit)submit.disabled=false}
  });
  document.addEventListener('input',e=>{let t=e.target;if(t.id==='catalogsearch'){query=t.value;$('#cataloglist').innerHTML=catalogList()}
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
   if(t.name==='period'){mg.period=t.value;render()}if(t.name==='range'&&t.value){mg[{jam:'day',hari:'month',bulan:'year'}[mg.period]]=t.value;render()}
   if(t.name==='method'){let paid=t.form.elements.paid;paid.value=totals().total;paid.readOnly=t.value!=='Tunai';$('#change').innerHTML=line('Kembalian',rp(0))}});
  window.addEventListener('hashchange',()=>{let m=location.hash.slice(1);if(allowed(m)){page=m;render()}});
  window.addEventListener('storage',e=>{
   if(e.key==='figiha.supabase'){db.logout();cartKey='';authError='';refresh();return}
   if(!db.config()&&e.key==='figiha.demo.v1'){if(!data||!dlg.open)refresh();else db.state().then(s=>{if(!s.me.owner&&(!s.me.menus.includes(page)||page==='pegawai')){close();refresh()}}).catch(()=>refresh())}
  });
  document.addEventListener('keydown',e=>{if(dlg.open||$('#rightnav').matches(':modal')||page!=='kasir'||!data)return;if(e.key==='F2'){e.preventDefault();$('#catalogsearch').focus()}if(e.key==='F8'){e.preventDefault();payment()}});
  dlg.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
  dlg.addEventListener('close',()=>{if(!dlg.open){dlg.replaceChildren();editing=null}});
  refresh();
})();
