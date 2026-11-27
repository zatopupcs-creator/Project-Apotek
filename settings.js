const ApotekSettings = (() => {
  const db = ApotekData;
  const {h,head,icon,btn,field,search,ticket,logoUrl,formEnd} = ApotekUI;
  const {managementRows,mg} = ApotekManagement;

  function connectionView(){
   const c=db.config();
   const code=c?"globalThis.APOTEK_SUPABASE = { url: '"+c.url+"', key: '"+c.key+"' };":'';
   const share=c?'<div class="sectiongap"><textarea class="control" id="cfgcode" rows="3" readonly spellcheck="false">'+h(code)+'</textarea><div class="actions">'+btn('copycfg','Salin kode','copy')+'</div></div>':'';
   return '<form id="configform"><div class="panelhead"><h2>Database</h2><span class="status '+(c?'':'demo')+'">'+(c?'Terhubung':'Belum terhubung')+'</span></div>'+
    '<div class="formgrid">'+
    field('Project URL','url',c?.url,{type:'url',required:true,wide:true,placeholder:'https://nama-proyek.supabase.co'})+
    field('Publishable key / anon key','key',c?.key,{required:true,wide:true,placeholder:'sb_publishable_…',extra:'autocomplete="off"'})+
    '</div>'+
    '<p class="error" role="alert"></p><div class="actions">'+(c?btn('disconnect','Putuskan database'):'')+btn('test','Uji koneksi','database')+'<button class="btn primary">Simpan koneksi</button></div></form>'+share;
  }
  function loginField(label,name,iconName,type,extra,toggle){
   const id='login-'+name;
   return '<div class="floatfield"><span class="inputicon">'+icon(iconName,19)+'<input class="control" id="'+id+'" name="'+name+'" type="'+type+'" placeholder=" " required '+extra+'><label for="'+id+'">'+h(label)+'</label>'+(toggle?'<button type="button" class="pwtoggle" aria-label="Tampilkan kata sandi"><span class="eye-show">'+icon('eye',19)+'</span><span class="eye-hide">'+icon('eyeoff',19)+'</span></button>':'')+'</span></div>';
  }
  function updateLoginBrand(name,logo){
   const img=document.querySelector('.signin-brand'),title=document.querySelector('.signin-form h1');
   if(img)img.src=logoUrl(logo)||'icon.svg';
   if(title){const shop=String(name||'').trim().replace(/^apotek\s+/i,'');title.textContent=shop?'Masuk ke apotek '+shop:'Masuk ke apotek'}
  }
  function loginView(error,name='',logo=''){
   const shop=String(name||'').trim().replace(/^apotek\s+/i,'');
   return '<div class="login-stage"><section class="signin-card">'+
    '<div class="signin-form"><img class="signin-brand" alt="" src="'+h(logoUrl(logo)||'icon.svg')+'"><h1>'+h(shop?'Masuk ke apotek '+shop:'Masuk ke apotek')+'</h1>'+
    '<form id="loginform"><div class="stack">'+
    loginField('Username atau ID pegawai','identifier','user','text','autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="40"')+
    loginField('Kata sandi','password','lock','password','autocomplete="current-password"',true)+
    '</div><button class="btn dark full login-submit">Masuk</button></form>'+
    '</div></section></div>';
  }
  function ownerForm(){
   const alias={required:true,extra:'maxlength="32" autocapitalize="none" spellcheck="false"'};
   return '<form id="ownerform"><p class="note">Akun ini mengelola data demo pada browser ini. Setelah masuk, daftarkan pegawai di Pengaturan → Akun login.</p><div class="formgrid">'+
    field('Nama pemilik','name','',{required:true,wide:true})+field('Username','username','pemilik',alias)+field('ID pemilik','employee_code','AP-001',alias)+
    field('Kata sandi','password','',{type:'password',required:true,wide:true,placeholder:'Minimal 8 karakter',extra:'minlength="8" autocomplete="new-password"'})+
    '</div>'+formEnd('Buat akun dan masuk')+'</form>';
  }
  function passwordForm(s,message=''){
   return '<form id="passwordform"><p class="note">Akun '+h(s.name)+' · '+h(s.username)+' / '+h(s.employee_code)+'</p>'+
    field('Kata sandi baru','password','',{type:'password',required:true,extra:'minlength="8" autocomplete="new-password"',placeholder:'Minimal 8 karakter'})+
    (message?'<p class="note">'+h(message)+'</p>':'')+formEnd('Simpan kata sandi')+'</form>';
  }
  function check(name,label,yes){return '<label class="checkline"><input type="checkbox" name="'+name+'" '+(yes?'checked':'')+'>'+h(label)+'</label>'}
  function logoTile(logo){return logoUrl(logo)?'<img alt="Logo pilihan" src="'+logo+'">':icon('kit',27)}
  function updateLogoTile(logo){
   document.querySelector('#logo-tile').innerHTML=logoTile(logo);
   document.querySelector('[data-a="clearlogo"]').hidden=!logoUrl(logo);
  }
  function receiptPreview(b){
   const sample={business:b,number:1,cashier:'Kasir contoh',at:Date.now(),items:[{name:'Produk contoh',price:10000,qty:1}],subtotal:10000,discount:0,total:10000,method:'Tunai',paid:10000,change:0};
   return ticket(sample);
  }
  function listView(d,tabs){
   const sub={bisnis:'Nama apotek, logo, dan isi struk',akun:'Kelola akun login pegawai',koneksi:'Koneksi database'};
   const row=(a,id,l,ic,s,cls)=>'<button type="button" class="morelink'+(cls?' '+cls:'')+'" data-a="'+a+'"'+(id?' data-id="'+id+'"':'')+'><span class="mico">'+icon(ic,20)+'</span><span class="mtxt"><b>'+l+'</b>'+(s?'<small>'+s+'</small>':'')+'</span>'+(a==='logout'?'':icon('right',16))+'</button>';
   const items=[['suplier','Suplier'],['riwayat','Riwayat'],['pegawai','Pegawai']].filter(([m])=>d.me.owner||(d.me.menus||[]).includes(m));
   return '<section class="moremenu"><h2>Pengaturan</h2><div class="morelist">'+tabs.map(([id,l,ic])=>row('setopen',id,l,ic,sub[id])).join('')+'</div></section>'+
    (items.length?'<section class="moremenu"><h2>Menu lainnya</h2><div class="morelist">'+items.map(([m,l])=>row('nav',m,l,m)).join('')+'</div></section>':'')+
    '<section class="moremenu"><h2>Akun</h2><div class="morelist">'+row('account','','Akun saya','user','Lihat akun yang sedang masuk')+row('logout','','Keluar','logout','','danger')+'</div></section>';
  }
  function settingsView(d,tab,draftLogo,mode){
   const tabs=[['bisnis','Bisnis & struk','receipt'],...(d.me.owner?[['akun','Akun login','pegawai'],['koneksi','Database','database']]:[])];
   const nav='<div class="settingsnav">'+tabs.map(([id,l,ic])=>btn('tab',l,ic,tab===id?'dark':'',id)).join('')+'</div>';
   const body=()=>{
   if(tab==='koneksi'&&d.me.owner)return '<div class="panel settingsbox">'+connectionView()+'</div>';
   if(tab==='akun'&&d.me.owner)return '<section class="panel"><div class="panelhead"><h2>Akun login</h2>'+btn('employee','Tambah akun','plus','dark')+'</div><div class="panelhead">'+search('mgsearch',mg.search,'Cari nama, username, atau ID…')+'</div><div id="mgrows">'+managementRows('pegawai',d)+'</div></section>';
   const b=d.settings;
   return '<div class="receipt-layout"><form id="businessform" class="panel"><div class="panelhead"><h2>Identitas dan isi struk</h2></div>'+
    '<div class="logo-editor"><div class="logo-tile" id="logo-tile">'+logoTile(draftLogo)+'</div><div><strong>Logo apotek</strong><small>Tampil di website dan dapat dicetak pada struk.</small><div class="tools">'+
    '<label class="uploadlogo">Pilih gambar<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp"></label> '+
    '<button type="button" class="quietlink" data-a="clearlogo" '+(!logoUrl(draftLogo)?'hidden':'')+'>Hapus logo</button></div></div></div>'+
    '<div class="formgrid">'+field('Nama apotek / bisnis','name',b.name,{required:true,wide:true,extra:'maxlength="120"'})+
    field('Alamat / detail lokasi','address',b.address,{textarea:true,wide:true,extra:'maxlength="500"'})+
    field('Nomor telepon','phone',b.phone,{type:'tel'})+field('Lebar kertas','width',b.width,{items:[['58','58 mm'],['80','80 mm']]})+
    field('Judul struk','receiptTitle',b.receiptTitle,{wide:true,placeholder:'Mis. Struk penjualan',extra:'maxlength="100"'})+
    field('Teks tambahan di kepala struk','headerText',b.headerText,{textarea:true,wide:true,placeholder:'Mis. nama cabang atau jam operasional',extra:'maxlength="500"'})+
    field('Pesan penutup','footer',b.footer,{textarea:true,wide:true,extra:'maxlength="1000"'})+
    '<div class="checks wide">'+check('showLogo','Tampilkan logo pada struk',b.showLogo!==false)+check('showCashier','Tampilkan nama kasir',b.showCashier!==false)+'</div></div>'+
    '<p class="error" role="alert"></p><div class="actions"><button class="btn primary">Simpan pengaturan</button></div></form>'+
    '<aside class="panel receipt-sample"><div class="panelhead"><h2>Pratinjau struk</h2>'+icon('receipt')+'</div><div id="receipt-preview">'+receiptPreview({...b,logo:draftLogo})+'</div></aside></div>';
   };
   if(mode==='list')return head('Pengaturan')+listView(d,tabs);
   if(mode==='detail'){const t=tabs.find(x=>x[0]===tab)||tabs[0];return '<div class="subhead"><button type="button" class="subback" data-a="setback" aria-label="Kembali">'+icon('back',22)+'</button><h1>'+h(t[1])+'</h1></div>'+body()}
   return head('Pengaturan')+nav+body();
  }
  function receiptValues(form,logo){
   const fd=new FormData(form);fd.delete('logoFile');
   return {...Object.fromEntries(fd),name:String(fd.get('name')||'').trim(),logo,showLogo:fd.has('showLogo'),showCashier:fd.has('showCashier')};
  }
  async function resizeLogo(file){
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Pilih logo PNG, JPG, atau WebP hingga 8 MB.');
   const source=await createImageBitmap(file);
   try {
    const scale=Math.min(1,240/Math.max(source.width,source.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.85);
   } finally {source.close()}
  }
return { connectionView, loginView, updateLoginBrand, ownerForm, passwordForm, updateLogoTile, receiptPreview, settingsView, receiptValues, resizeLogo };
})();
