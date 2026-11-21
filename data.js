export const menus={kasir:'Kasir',stok:'Stok',suplier:'Suplier',laporan:'Laporan',riwayat:'Riwayat',pegawai:'Pegawai',pengaturan:'Pengaturan'};
export const categories=['Obat','Vitamin','Herbal','Alat kesehatan','Perawatan'];
const localKey='figiha.demo.v1', cfgKey='figiha.supabase', authKey='figiha.session';
const settingsId='00000000-0000-0000-0000-000000000001';
export const uuid=()=>crypto.randomUUID();
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
 const owner={id:'20000000-0000-0000-0000-000000000001',name:'Pemilik',email:'',owner:true,active:true,menus:Object.keys(menus),rev:1};
 return {settings:{id:settingsId,name:'Apotek Figiha',address:'',phone:'',footer:'Terima kasih atas kunjungan Anda.',width:'80',rev:1},suppliers,staff:[owner],me:owner,sales:[],products:rows.map(([name,category,unit,detail,price,cost,stock,img],i)=>({id:'30000000-0000-0000-0000-'+String(i+1).padStart(12,'0'),name,category,unit,detail,price,cost,stock,image:'assets/'+img+'.jpg',sku:'AF-'+String(i+1).padStart(3,'0'),minimum:10,supplier:suppliers[i%2].id,batch:'',expiry:'',rev:1}))};
}
export function config(){return JSON.parse(localStorage.getItem(cfgKey)||'null')}
export function session(){return JSON.parse(sessionStorage.getItem(authKey)||'null')}
export function logout(){sessionStorage.removeItem(authKey)}
export function disconnect(){logout();localStorage.removeItem(cfgKey)}
export function parseConfig(url,key){
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
export async function testConfig(c){await http(c,'/auth/v1/settings',undefined,null,'GET')}
export async function connect(c){await testConfig(c);logout();localStorage.setItem(cfgKey,JSON.stringify(c))}
export async function login(email,password,newAccount=false){
 const data=await http(config(),newAccount?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{email,password});
 if(data?.access_token){sessionStorage.setItem(authKey,JSON.stringify(data));return true}return false;
}
async function rpc(name,body={}){
 let auth=session();if(!auth)throw Error('Masuk untuk menggunakan database.');
 if(auth.expires_at*1000<Date.now()+45000){
 try{auth=await http(config(),'/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token});sessionStorage.setItem(authKey,JSON.stringify(auth))}catch(e){logout();throw e}
 }
 return http(config(),'/rest/v1/rpc/figiha_'+name,body,auth.access_token);
}
function readLocal(){let data=localStorage.getItem(localKey);if(data)return JSON.parse(data);let initial=seed();localStorage.setItem(localKey,JSON.stringify(initial));return initial}
async function changeLocal(fn){const act=()=>{const db=readLocal(),result=fn(db);localStorage.setItem(localKey,JSON.stringify(db));return result};return navigator.locks?navigator.locks.request(localKey,act):act()}
export async function state(){return config()?rpc('state'):readLocal()}
export async function save(kind,id,rev,data){
 if(config())return rpc('save',{p_kind:kind,p_id:id,p_rev:rev,p_data:data});
 return changeLocal(db=>{
 const rows=kind==='settings'?[db.settings]:db[kind],idx=rows.findIndex(x=>x.id===id),old=rows[idx];
 if((old?.rev||0)!==rev)throw Error('Data telah berubah. Muat ulang lalu coba lagi.');
 if(kind==='products'&&rows.some(x=>x.id!==id&&x.sku.toLowerCase()===data.sku.toLowerCase()))throw Error('Kode SKU sudah digunakan.');
 if(kind==='staff'&&rows.some(x=>x.id!==id&&x.email.toLowerCase()===data.email.toLowerCase()))throw Error('Email pegawai sudah terdaftar.');
 const record={...old,...data,id,rev:rev+1};
 if(kind==='settings')db.settings=record;else if(idx<0)rows.push(record);else rows[idx]=record;
 });
}
export async function checkout(id,cart,discount,paid,method){
 if(config())return rpc('checkout',{p_id:id,p_items:cart,p_discount:discount,p_paid:paid,p_method:method});
 return changeLocal(db=>{
 const saved=db.sales.find(x=>x.id===id);if(saved)return saved;
 let subtotal=0,cost=0;const items=cart.map(({id,qty})=>{
 const p=db.products.find(x=>x.id===id);if(!p||!Number.isInteger(qty)||qty<1||p.stock<qty)throw Error('Stok '+(p?.name||'produk')+' tidak mencukupi.');
 subtotal+=p.price*qty;cost+=p.cost*qty;p.stock-=qty;p.rev++;return {id,qty,name:p.name,unit:p.unit,price:p.price};
 });
 const total=subtotal-discount;if(!items.length||discount<0||total<0||paid<total)throw Error('Periksa kembali total pembayaran.');
 const sale={id,number:db.sales.length+1,at:new Date().toISOString(),cashier:db.me.name,business:{...db.settings},items,subtotal,cost,discount,total,paid,change:paid-total,method};db.sales.unshift(sale);return sale;
 });
}
