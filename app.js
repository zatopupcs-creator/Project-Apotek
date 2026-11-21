import * as db from './data.js';
import {h,rp,date,nomor,head,btn,ib,field,icon,line,ticket,photo,search,empty,formEnd} from './ui.js';
import {management,managementRows,productForm,supplierForm,employeeForm,contact,exportCsv,mg} from './management.js';
const $=s=>document.querySelector(s),dlg=$('#dialog');
let data,page=location.hash.slice(1)||'kasir',query='',category='Semua',sort='default',available=false,cart={},discount=0,cartKey='',orderId='',settingsTab='bisnis',editing=null,currentSale=null,authError='',pending=false,timer,busy=false;
const owner=()=>Boolean(data?.me?.owner),allowed=m=>!!data&&(owner()||m!=='pegawai'&&data.me.menus.includes(m));
const product=id=>data.products.find(p=>p.id===id);
const asForm=form=>Object.fromEntries(new FormData(form));
const feedback=msg=>{let t=$('#toast');t.textContent=msg;clearTimeout(timer);timer=setTimeout(()=>t.textContent='',3300)};
function modal(title,body){dlg.innerHTML='<div class="modalhead"><h2>'+h(title)+'</h2>'+ib('close','Tutup','close')+'</div><div class="modalbody">'+body+'</div>';if(!dlg.open)dlg.showModal()}
function close(){if(dlg.open)dlg.close();editing=null}
function loadDraft(){
 const key='figiha.cart.'+(db.config()?.url||'demo')+'.'+data.me.id;
 if(key===cartKey)return;cartKey=key;const draft=JSON.parse(sessionStorage.getItem(key)||'{}');cart=draft.cart||{};discount=draft.discount||0;orderId=draft.id||db.uuid();pending=Boolean(draft.pending);
}
function saveDraft(){sessionStorage.setItem(cartKey,JSON.stringify({cart,discount,id:orderId,pending}))}
function resetDraft(){cart={};discount=0;orderId=db.uuid();pending=false;saveDraft()}
function cartLines(){return Object.entries(cart).map(([id,qty])=>({p:product(id),qty})).filter(x=>x.p&&x.qty>0)}
function totals(){let lines=cartLines(),sub=lines.reduce((n,{p,qty})=>n+p.price*qty,0),qty=lines.reduce((n,x)=>n+x.qty,0);return {sub,qty,total:Math.max(0,sub-discount),lines}}
async function refresh(){if(db.config()&&!db.session()){data=null;render();return}try{data=await db.state();authError='';loadDraft();render()}catch(e){data=null;authError=e.message;render()}}
function nav(m){if(!allowed(m))return;page=m;mg.search='';if(location.hash!=='#'+m)location.hash=m;render()}
function render(){
 const business=data?.settings?.name||'Apotek Figiha',me=data?.me;
 if(data&&!allowed(page))page=Object.keys(db.menus).find(allowed)||'noaccess';
 document.title=(db.menus[page]||'Kasir')+' · '+business;
 $('#header').className='sitehead';$('#header').innerHTML='<div class="headinner"><button type="button" class="brand" data-a="home"><img alt="" src="icon.svg"><span>'+h(business)+'</span></button><nav class="headnav" aria-label="Menu utama">'+(me?Object.entries(db.menus).filter(([m])=>allowed(m)).map(([m,l])=>'<button class="navbtn '+(page===m?'current':'')+'" data-a="nav" data-id="'+m+'" '+(page===m?'aria-current="page"':'')+'>'+icon(m,17)+h(l)+'</button>').join(''):'')+'</nav>'+(me?'<button type="button" class="profile" data-a="account"><span class="avatar">'+h((me.owner?'AD':me.name.slice(0,2)).toUpperCase())+'</span><span class="pname">'+h(me.owner?'Admin':me.name)+'</span>'+icon('down',14)+'</button>':'')+'</div>';
 if(!data){$('#main').innerHTML=loginView();return}
 $('#main').innerHTML=page==='kasir'?pos():page==='pengaturan'?settingsView():page==='noaccess'?empty('Belum ada menu yang diizinkan','Hubungi pemilik untuk mengatur akses akun Anda.'):management(page,data);
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
function doPrint(){document.documentElement.style.setProperty('--paper',currentSale.business.width==='58'?'58mm':'80mm');$('#print').innerHTML=ticket(currentSale);window.print()}
function settingsView(){return head('Pengaturan','Atur identitas apotek, tampilan struk, dan koneksi database.')+'<div class="settingsnav">'+btn('tab','Bisnis & struk','receipt',settingsTab==='bisnis'?'dark':'','bisnis')+btn('tab','Koneksi Supabase','database',settingsTab==='koneksi'?'dark':'','koneksi')+'</div><div class="panel settingsbox">'+(settingsTab==='koneksi'?connectionView():businessForm())+'</div>'}
function businessForm(){let b=data.settings;return '<form id="businessform"><div class="panelhead"><h2>Identitas bisnis dan struk</h2></div><div class="formgrid">'+field('Nama bisnis / apotek','name',b.name,{required:true,wide:true})+field('Alamat / detail lokasi','address',b.address,{textarea:true,wide:true})+field('Nomor telepon','phone',b.phone,{type:'tel'})+field('Lebar kertas struk','width',b.width,{items:[['58','58 mm'],['80','80 mm']]})+field('Teks penutup struk','footer',b.footer,{textarea:true,wide:true})+'</div><p class="error"></p><div class="actions"><button class="btn primary">Simpan pengaturan</button></div></form>'}
function connectionView(){let c=db.config();return '<form id="configform"><div class="panelhead"><h2>Koneksi Supabase</h2><span class="status '+(c?'':'demo')+'">'+(c?'Dikonfigurasi':'Mode demo')+'</span></div><p class="note">Koneksi ini berlaku untuk browser ini. Data contoh tetap terpisah dari transaksi apotek di Supabase.</p><div class="formgrid">'+field('Project URL','url',c?.url,{type:'url',required:true,wide:true,placeholder:'https://nama-proyek.supabase.co'})+field('Publishable key / anon key','key',c?.key,{required:true,wide:true,placeholder:'sb_publishable_…',extra:'autocomplete="off"'})+'</div><details class="sectiongap" '+(c?'':'open')+'><summary>Penyiapan database dan akun pemilik</summary><ol class="setupsteps"><li>Unduh <a href="database.sql" download="apotek-figiha.sql">skema SQL apotek</a> dan jalankan isinya di SQL Editor proyek Supabase.</li><li>Buat akun pemilik di Authentication → Users dengan email terkonfirmasi.</li><li>Salin perintah INSERT pada akhir file SQL, hapus tanda komentar, isi email pemilik, lalu jalankan di SQL Editor.</li><li>Simpan URL dan kunci publik di sini, lalu masuk dengan akun pemilik. Ulangi pengisian koneksi pada perangkat pegawai.</li></ol></details><p class="error"></p><div class="actions">'+(c?btn('disconnect','Kembali ke demo'):'')+btn('test','Uji koneksi','database')+'<button class="btn primary">Simpan koneksi</button></div></form>'}
function loginView(){return '<section class="panel loginpanel"><div class="panelhead"><h2>Masuk ke apotek</h2>'+icon('kasir')+'</div><p class="note">Gunakan akun pegawai yang terdaftar di database apotek.</p><form id="loginform"><div class="stack">'+field('Email','email','',{type:'email',required:true,extra:'autocomplete="username"'})+field('Kata sandi','password','',{type:'password',required:true,extra:'autocomplete="current-password" minlength="6"'})+'</div><p class="error">'+h(authError)+'</p><div class="actions"><button name="intent" value="signup" class="btn" type="submit">Daftar akun</button><button name="intent" value="login" class="btn primary" type="submit">Masuk</button></div></form><div class="sectiongap">'+btn('connection','Pengaturan koneksi','database')+'</div></section>'}
function account(){const m=data.me;modal('Akun pengguna',line('Nama',m.name)+line('Peran',m.owner?'Pemilik':'Pegawai')+line('Penyimpanan',db.config()?'Supabase':'Demo perangkat')+'<div class="actions">'+(allowed('pengaturan')?btn('opensettings','Pengaturan','pengaturan'):'')+(db.config()?btn('logout','Keluar akun'):'')+'</div>')}
function edit(kind,id){
 const [key,label,form]={product:['products','produk',productForm],supplier:['suppliers','suplier',supplierForm],employee:['staff','pegawai',employeeForm]}[kind];
 editing=id?data[key].find(x=>x.id===id):null;modal((editing?'Edit ':'Tambah ')+label,form(editing||undefined,data));
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
 case 'nav':nav(id);break;case 'home':if(data)nav(Object.keys(db.menus).find(allowed));break;
 case 'account':account();break;case 'close':close();break;
 case 'category':category=id;render();break;case 'add':case 'minus':case 'remove':changeQty(id,a);break;
 case 'jumpcart':$('#cart').scrollIntoView({behavior:'smooth'});break;
 case 'filter':modal('Filter produk','<form id="filterform"><div class="stack">'+field('Urutkan produk','sort',sort,{items:[['default','Urutan katalog'],['name','Nama A–Z'],['low','Harga terendah'],['high','Harga tertinggi']]})+'<label class="checkline"><input type="checkbox" name="available" '+(available?'checked':'')+'>Hanya produk dengan stok tersedia</label></div>'+formEnd('Terapkan filter')+'</form>');break;
 case 'discount':if(!pending)modal('Diskon transaksi','<form id="discountform">'+field('Potongan harga (Rp)','discount',discount,{type:'number',required:true,min:0,extra:'step="1" max="'+totals().sub+'"'})+formEnd('Terapkan diskon')+'</form>');break;
 case 'pay':payment();break;case 'retry':busy=true;await finishPayment(JSON.parse(sessionStorage.getItem(cartKey+'.payment')));break;
 case 'receipt':showReceipt(data.sales.find(s=>s.id===id));break;case 'print':doPrint();break;
 case 'product':case 'supplier':case 'employee':edit(a,id);break;
 case 'contact':{let s=data.suppliers.find(s=>s.id===id);modal(s.name,contact(s,data.products)+(allowed('suplier')?'<div class="actions">'+btn('supplier','Edit suplier','edit','',s.id)+'</div>':''));break}
 case 'export':exportCsv(data);break;case 'tab':settingsTab=id;render();break;case 'opensettings':close();nav('pengaturan');break;
 case 'connection':modal('Pengaturan database',connectionView());break;
 case 'test':{let f=button.closest('form');if(!f.reportValidity())return;busy=true;button.disabled=true;let v=asForm(f);await db.testConfig(db.parseConfig(v.url,v.key));f.querySelector('.error').textContent='';feedback('Supabase dapat dijangkau. URL dan kunci publik diterima.');break}
 case 'logout':db.logout();close();data=null;authError='';cartKey='';render();break;
 case 'disconnect':db.disconnect();close();cartKey='';page='kasir';await refresh();break;
 }}catch(ex){err(ex,button.closest('form'))}finally{busy=false;if(a==='test')button.disabled=false}
});
document.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const form=e.target,v=asForm(form),fd=new FormData(form),submit=e.submitter,b=form.id;busy=true;if(submit)submit.disabled=true;let error=form.querySelector('.error');if(error)error.textContent='';
 try{
 if(b==='filterform'){sort=v.sort;available=fd.has('available');close();render();return}
 if(b==='discountform'){discount=Number(v.discount);close();updateCart();return}
 if(b==='paymentform'){await finishPayment({id:orderId,items:totals().lines.map(({p,qty})=>({id:p.id,qty,price:p.price})),discount,paid:Number(v.paid),method:v.method});return}
 if(b==='loginform'){let signed=await db.login(v.email,v.password,submit?.value==='signup');if(!signed){feedback('Periksa email untuk konfirmasi akun, lalu masuk.');return}cartKey='';await refresh();return}
 if(b==='configform'){await db.connect(db.parseConfig(v.url,v.key));authError='';cartKey='';close();await refresh();return}
 if(b==='businessform'){await db.save('settings',data.settings.id,data.settings.rev,v)}
 else{let kind={productform:'products',supplierform:'suppliers',employeeform:'staff'}[b];if(!kind)return;
 if(b==='productform'){v.image=await readPhoto(fd.get('upload'));delete v.upload;for(let n of ['stock','minimum','cost','price'])v[n]=Number(v[n]);v.sku=v.sku.trim();if(!v.sku||!v.unit.trim())throw Error('Isi SKU dan satuan penjualan.')}
 if(b==='employeeform'){v.menus=fd.getAll('menus');v.active=fd.has('active');v.email=v.email.trim().toLowerCase()}
 if(!v.name.trim())throw Error('Nama wajib diisi.');await db.save(kind,editing?.id||db.uuid(),editing?.rev||0,v);close()}
 await refresh();feedback('Perubahan disimpan.');
 }catch(ex){err(ex,form)}finally{busy=false;if(submit)submit.disabled=false}
});
document.addEventListener('input',e=>{let t=e.target;if(t.id==='catalogsearch'){query=t.value;$('#cataloglist').innerHTML=catalogList()}
 if(t.id==='mgsearch'){mg.search=t.value;$('#mgrows').innerHTML=managementRows(page,data)}
 if(t.name==='paid'&&$('#change'))$('#change').innerHTML=line('Kembalian',rp(Math.max(0,t.value-totals().total)));});
document.addEventListener('change',e=>{let t=e.target;if(t.name==='period'){mg.period=t.value;render()}if(t.name==='range'&&t.value){mg[{jam:'day',hari:'month',bulan:'year'}[mg.period]]=t.value;render()}
 if(t.name==='method'){let paid=t.form.elements.paid;paid.value=totals().total;paid.readOnly=t.value!=='Tunai';$('#change').innerHTML=line('Kembalian',rp(0))}});
window.addEventListener('hashchange',()=>{let m=location.hash.slice(1);if(allowed(m)){page=m;render()}});
window.addEventListener('storage',e=>{if(!dlg.open&&(!db.config()||e.key==='figiha.supabase'))refresh()});
document.addEventListener('keydown',e=>{if(dlg.open||page!=='kasir'||!data)return;if(e.key==='F2'){e.preventDefault();$('#catalogsearch').focus()}if(e.key==='F8'){e.preventDefault();payment()}});
dlg.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
refresh();
