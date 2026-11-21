const ApotekData = (() => {
  const menus={kasir:'Kasir',stok:'Stok',suplier:'Suplier',laporan:'Laporan',riwayat:'Riwayat',pegawai:'Pegawai',pengaturan:'Pengaturan'};
  const categories=['Obat','Vitamin','Herbal','Alat kesehatan','Perawatan'];
  const localKey='figiha.demo.v1', cfgKey='figiha.supabase', authKey='figiha.session.v2', demoSessionKey='figiha.demo.login.v2';
  const settingsId='00000000-0000-0000-0000-000000000001';
  const defaultName='Bee Farma';
  const defaultCredential={salt:'9186b0d8f63b594553c7eb017c04f1cb',iterations:310000,hash:'33044735f358a919c8981b427514e5146f6e6652b83c09fc7cdf6806d431ee9f',version:'40000000-0000-0000-0000-00000000b3ef'};
  const uuid=()=>crypto.randomUUID();
  function seed(){
   const suppliers=[
   {id:'10000000-0000-0000-0000-000000000001',name:'Sehat Sentosa',phone:'',wa:'',address:'',contact:'',email:'',rev:1},
   {id:'10000000-0000-0000-0000-000000000002',name:'Mitra Medika',phone:'',wa:'',address:'',contact:'',email:'',rev:1}];
   const rows=[
   ['Paracetamol 500 mg','Obat','Strip','10 tablet',6500,4200,128,'paracetamol'],
   ['Vitamin C 500 mg','Vitamin','Botol','Tablet vitamin C',35000,26000,45,'vitamin-c'],
   ['Minyak Kayu Putih','Herbal','Botol','120 ml',32000,24000,36,'minyak-kayu-putih'],
   ['Plester Luka','Alat kesehatan','Kotak','10 lembar',12000,7500,64,'plester'],
   ['Antiseptik Cair','Perawatan','Botol','60 ml',18500,12500,28,'antiseptik'],
   ['Masker Medis','Alat kesehatan','Kotak','Masker sekali pakai',25000,18000,52,'masker'],
   ['Oralit','Obat','Sachet','Serbuk oralit',2500,1500,75,'oralit'],
   ['Hand Sanitizer','Perawatan','Botol','500 ml',42500,30000,8,'hand-sanitizer']];
   const owner={id:'20000000-0000-0000-0000-000000000001',name:defaultName,email:'',username:'beefarma',employee_code:'BF-001',credential:{...defaultCredential},owner:true,active:true,menus:Object.keys(menus),rev:1};
   return {settings:{id:settingsId,name:defaultName,address:'',phone:'',footer:'Terima kasih atas kunjungan Anda.',width:'80',rev:1},suppliers,staff:[owner],me:owner,sales:[],products:rows.map(([name,category,unit,detail,price,cost,stock,img],i)=>({id:'30000000-0000-0000-0000-'+String(i+1).padStart(12,'0'),name,category,unit,detail,price,cost,stock,image:'assets/'+img+'.jpg',sku:'AF-'+String(i+1).padStart(3,'0'),minimum:10,supplier:suppliers[i%2].id,batch:'',expiry:'',rev:1}))};
  }
  function config(){return JSON.parse(localStorage.getItem(cfgKey)||'null')||globalThis.APOTEK_SUPABASE||null}
  function session(){return JSON.parse(sessionStorage.getItem(config()?authKey:demoSessionKey)||'null')}
  function logout(){
   sessionStorage.removeItem('figiha.session');
   sessionStorage.removeItem(authKey);
   sessionStorage.removeItem(demoSessionKey);
  }
  function disconnect(){logout();localStorage.removeItem(cfgKey)}
  function parseConfig(url,key){
   let base;try{base=new URL(url.trim())}catch{throw Error('Project URL tidak valid.')}
   if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('Gunakan Project URL HTTPS tanpa path tambahan.');
   key=key.trim();if(!key.startsWith('sb_publishable_')){
   let role='';try{role=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role}catch{}
   if(role!=='anon')throw Error('Gunakan publishable key atau anon key dari proyek Anda.');
   }
   return {url:base.origin,key};
  }
  async function http(c,path,body,access,method='POST'){
   let res;try{res=await fetch(c.url+path,{method,headers:{'Content-Type':'application/json',apikey:c.key,...(access?{Authorization:'Bearer '+access}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})})}catch{throw Error('Gagal menjangkau Supabase. Periksa URL dan jaringan.')}
   const data=await res.json().catch(()=>null);
   if(!res.ok)throw Error(data?.msg||data?.message||data?.error_description||'Permintaan Supabase gagal ('+res.status+').');
   return data;
  }
  async function testConfig(c){
   await http(c,'/auth/v1/settings',undefined,null,'GET');
   const brand=await http(c,'/rest/v1/rpc/figiha_branding',{}).catch(()=>{throw Error('URL dan kunci diterima. Jalankan database.sql terbaru di SQL Editor.')});
   if(!brand?.name)throw Error('Identitas apotek belum tersedia di database.');
   const health=await http(c,'/functions/v1/apotek-akses',{action:'health'}).catch(()=>{throw Error('Periksa deployment apotek-akses dan pengaturan Verify JWT pada fungsi tersebut.')});
   if(!health?.ready)throw Error('Fungsi login belum siap.');
  }
  async function connect(c){await testConfig(c);logout();localStorage.setItem(cfgKey,JSON.stringify(c))}
  const invalidLogin='Username/ID atau kata sandi salah';
  const cleanId=v=>String(v??'').trim().replace(/\s+/g,'');
  function rememberAuth(auth){
   if(!auth.expires_at)auth.expires_at=Math.floor(Date.now()/1000)+Number(auth.expires_in||3600);
   sessionStorage.setItem(authKey,JSON.stringify(auth));
  }
  async function accessToken(){
   let auth=session();if(!auth?.access_token)throw Error('Masuk untuk menggunakan database.');
   const expires=auth.expires_at*1000;
   if(!expires||expires<Date.now()+45000){
    try{auth=await http(config(),'/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token});rememberAuth(auth)}
    catch(e){logout();throw e}
   }
   return auth.access_token;
  }
  async function rpc(name,body={}){return http(config(),'/rest/v1/rpc/figiha_'+name,body,await accessToken())}
  const edge='/functions/v1/apotek-akses';
  async function login(identifier,password){
   if(!config())return loginLocal(identifier,password);
   let auth;
   try{auth=await http(config(),edge,{action:'login',identifier:cleanId(identifier),password})}
   catch(e){if(/keliru|salah|belum aktif|401/i.test(e.message))throw Error(invalidLogin);throw e}
   if(!auth?.access_token)throw Error(invalidLogin);
   rememberAuth(auth);
  }
  async function branding(){
   if(config())return http(config(),'/rest/v1/rpc/figiha_branding',{});
   const {name,logo}=readLocal().settings;return {name,logo};
  }
  async function setPassword(id,password){
   validatePassword(password);
   if(config())return http(config(),edge,{action:'password',staff_id:id,password},await accessToken());
   const credential=await createCredential(password);
   return changeLocal(d=>{
    const actor=localMe(d);if(!actor.owner)throw Error('Hanya pemilik yang dapat mengatur akun.');
    const person=d.staff.find(s=>s.id===id);if(!person)throw Error('Akun tidak ditemukan.');
    if(!person.username||!person.employee_code)throw Error('Simpan username dan ID pegawai sebelum mengaktifkan login.');
    person.credential=credential;
    if(person.id===actor.id)startLocalSession(person);
   });
  }
  function validatePassword(password){
   if(typeof password!=='string'||password.length<8||new TextEncoder().encode(password).length>72)throw Error('Gunakan kata sandi minimal 8 karakter dan maksimal 72 byte.');
  }
  const bytesToHex=bytes=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
  async function derivePassword(password,salt,iterations){
   const saltBytes=Uint8Array.from(salt.match(/../g),pair=>parseInt(pair,16));
   const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
   const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBytes,iterations},material,256);
   return bytesToHex(new Uint8Array(bits));
  }
  async function createCredential(password){
   validatePassword(password);
   const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16))), iterations=310000;
   return {salt,iterations,hash:await derivePassword(password,salt,iterations),version:uuid()};
  }
  function startLocalSession(person){
   sessionStorage.setItem(demoSessionKey,JSON.stringify({id:person.id,version:person.credential.version,expires:Date.now()+12*3600000}));
  }
  function localMe(d){
   const saved=session(), person=saved&&d.staff.find(s=>s.id===saved.id);
   if(!person?.active||!person.credential||saved.expires<=Date.now()||saved.version!==person.credential.version){
    logout();throw Error('Sesi telah berakhir. Silakan masuk kembali.');
   }
   return person;
  }
  const can=(person,menu)=>person.owner||person.menus.includes(menu);
  function publicProfile(s){
   const {credential,email,...profile}=s;
   return {...profile,provisioned:Boolean(credential),managed_password:true};
  }
  function needsOwner(){return !config()&&!readLocal().staff.some(s=>s.owner&&s.credential)}
  function cleanIdentifiers(profile,staff,id){
   const username=String(profile.username||'').trim().toLowerCase(), employee_code=String(profile.employee_code||'').trim();
   if(![username,employee_code].every(a=>/^[a-z0-9][a-z0-9._-]{0,31}$/i.test(a)))throw Error('Gunakan 1–32 huruf, angka, titik, garis bawah, atau tanda hubung untuk username dan ID.');
   const used=[username,employee_code.toLowerCase()];
   if(staff.some(s=>s.id!==id&&[s.username,s.employee_code].some(a=>a&&used.includes(a.toLowerCase()))))throw Error('Username atau ID sudah digunakan akun lain.');
   return {username,employee_code};
  }
  async function setupDemoOwner(profile,password){
   if(config())throw Error('Gunakan akun pemilik proyek Supabase Anda.');
   const credential=await createCredential(password);
   const person=await changeLocal(d=>{
    const owner=d.staff.find(s=>s.owner);
    if(!owner||owner.credential)throw Error('Akun pemilik sudah tersedia.');
    const name=profile.name.trim();if(!name)throw Error('Nama wajib diisi.');
    Object.assign(owner,cleanIdentifiers(profile,d.staff,owner.id),{name,credential,active:true,rev:owner.rev+1});
    return owner;
   });
   startLocalSession(person);
  }
  async function loginLocal(identifier,password){
   const alias=cleanId(identifier).toLowerCase(),s=readLocal().staff.find(p=>p.active&&[p.username,p.employee_code].some(v=>v&&v.toLowerCase()===alias));
   if(!s?.credential)throw Error(invalidLogin);
   const {hash,salt,iterations}=s.credential;if(await derivePassword(password,salt,iterations)!==hash)throw Error(invalidLogin);
   startLocalSession(s);
  }
  function readLocal(){let data=localStorage.getItem(localKey);if(data){
   const d=JSON.parse(data),o=d.staff?.find(x=>x.owner);
   if(o&&!o.credential){Object.assign(o,{username:o.username||'beefarma',employee_code:o.employee_code||'BF-001',credential:{...defaultCredential},active:true});if(!d.settings?.name||d.settings.name==='Apotek Figiha')d.settings.name=defaultName;localStorage.setItem(localKey,JSON.stringify(d))}
   return d}
   let initial=seed();localStorage.setItem(localKey,JSON.stringify(initial));return initial}
  async function changeLocal(fn){const act=()=>{const db=readLocal(),result=fn(db);localStorage.setItem(localKey,JSON.stringify(db));return result};return navigator.locks?navigator.locks.request(localKey,act):act()}
  function restoreLogo(s,logos){
   if(!s.business?.logoRef)return s;
   return {...s,business:{...s.business,logo:logos?.[s.business.logoRef]||''}};
  }
  function snapshotBusiness(d){
   const b={...d.settings};if(!b.logo)return b;
   d.receiptLogos??={};
   const existing=Object.keys(d.receiptLogos).find(id=>d.receiptLogos[id]===b.logo);
   b.logoRef=existing||uuid();d.receiptLogos[b.logoRef]=b.logo;delete b.logo;
   return b;
  }
  async function state(){
   if(config()){
    const state=await rpc('state');
    return {...state,sales:state.sales.map(s=>restoreLogo(s,state.receiptLogos))};
   }
   const d=readLocal(),me=localMe(d),stock=can(me,'stok'),reports=can(me,'laporan');
   const products=(stock||can(me,'kasir')||can(me,'suplier'))?d.products.map(p=>{
    if(stock)return p;const {cost,batch,expiry,...item}=p;return item;
   }):[];
   const sales=(reports||can(me,'riwayat'))?d.sales.map(s=>{if(reports)return s;const {cost,...summary}=s;return summary}):[];
   return {me:publicProfile(me),settings:d.settings,products,sales:sales.map(s=>restoreLogo(s,d.receiptLogos)),staff:me.owner?d.staff.map(publicProfile):[],
   suppliers:(stock||can(me,'suplier'))?d.suppliers:[]};
  }
  async function save(kind,id,rev,data){
   if(config())return rpc('save',{p_kind:kind,p_id:id,p_rev:rev,p_data:data});
   return changeLocal(db=>{
   const permission={products:'stok',suppliers:'suplier',settings:'pengaturan',staff:'pegawai'}[kind],actor=localMe(db);
   if(!permission||(kind==='staff'?!actor.owner:!can(actor,permission)))throw Error('Akses ditolak.');
   const rows=kind==='settings'?[db.settings]:db[kind],idx=rows.findIndex(x=>x.id===id),old=rows[idx];
   if((old?.rev||0)!==rev)throw Error('Data telah berubah. Muat ulang lalu coba lagi.');
   if(kind==='products'&&rows.some(x=>x.id!==id&&x.sku.toLowerCase()===data.sku.toLowerCase()))throw Error('Kode SKU sudah digunakan.');
   if(kind==='staff'){
    const aliases=cleanIdentifiers(data,rows,id);
    data={...aliases,name:data.name.trim(),active:old?.owner?true:Boolean(data.active),menus:old?.owner?old.menus:data.menus.filter(m=>m!=='pegawai'&&Object.hasOwn(menus,m))};
   }
   const record={...old,...data,id,rev:rev+1};
   if(kind==='settings')db.settings=record;else if(idx<0)rows.push(record);else rows[idx]=record;
   });
  }
  async function checkout(id,cart,discount,paid,method){
   if(config())return rpc('checkout',{p_id:id,p_items:cart,p_discount:discount,p_paid:paid,p_method:method});
   return changeLocal(db=>{
   const cashier=localMe(db);if(!can(cashier,'kasir'))throw Error('Akses ditolak.');
   const saved=db.sales.find(x=>x.id===id);if(saved)return restoreLogo(saved,db.receiptLogos);
   let subtotal=0,cost=0;const items=cart.map(({id,qty})=>{
   const p=db.products.find(x=>x.id===id);if(!p||!Number.isInteger(qty)||qty<1||p.stock<qty)throw Error('Stok '+(p?.name||'produk')+' tidak mencukupi.');
   subtotal+=p.price*qty;cost+=p.cost*qty;p.stock-=qty;p.rev++;return {id,qty,name:p.name,unit:p.unit,price:p.price};
   });
   const total=subtotal-discount;if(!items.length||discount<0||total<0||paid<total)throw Error('Periksa kembali total pembayaran.');
   const sale={id,number:db.sales.length+1,at:new Date().toISOString(),cashier:cashier.name,business:snapshotBusiness(db),items,subtotal,cost,discount,total,paid,change:paid-total,method};db.sales.unshift(sale);return restoreLogo(sale,db.receiptLogos);
   });
  }
return { menus, categories, uuid, config, session, logout, disconnect, parseConfig, testConfig, connect, login, branding, setPassword, needsOwner, setupDemoOwner, state, save, checkout };
})();
