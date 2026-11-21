import {h,rp,date,nomor,head,empty,table,row,btn,ib,photo,line,field,search,icon,formEnd} from './ui.js';
import {categories,menus} from './data.js';
const atDate=s=>new Date(new Date(s).getTime()+7*3600000).toISOString();
export const today=()=>atDate(Date.now()).slice(0,10);
export const mg={search:'',period:'hari',day:today(),month:today().slice(0,7),year:today().slice(0,4)};
const find=(array,id)=>array.find(x=>x.id===id);
const matches=(...values)=>values.join(' ').toLowerCase().includes(mg.search.toLowerCase());
const pic=p=>'<span class="thumb">'+photo(p)+'</span>';
const item=p=>'<div class="tableproduct">'+pic(p)+'<div><b>'+h(p.name)+'</b><small>'+h(p.sku)+' · '+h(p.unit)+'</small></div></div>';
export function management(page,d){
 if(page==='laporan')return reports(d);
 let title=menus[page],desc={stok:'Kelola persediaan, harga, dan detail produk apotek.',suplier:'Kelola kontak suplier dan produk yang dipasok.',pegawai:'Kelola pegawai dan tentukan akses menu setiap akun.',riwayat:'Lihat rincian transaksi dan cetak kembali struk penjualan.'}[page];
 const add={stok:['product','Tambah produk'],suplier:['supplier','Tambah suplier'],pegawai:['employee','Tambah pegawai']}[page];
 return head(title,desc,add?btn(add[0],add[1],'plus','dark'):'')+'<div class="panel"><div class="panelhead">'+search('mgsearch',mg.search,'Cari '+({stok:'nama produk atau SKU',suplier:'nama suplier',pegawai:'nama atau email',riwayat:'nomor struk atau kasir'}[page])+'…')+'</div><div id="mgrows">'+managementRows(page,d)+'</div></div>';
}
export function managementRows(page,d){
 let headers,rows;
 if(page==='stok'){
 headers=['Produk','Kategori','Stok','Harga beli','Harga jual','Suplier',''];rows=d.products.filter(p=>matches(p.name,p.sku,p.category)).map(p=>{let s=find(d.suppliers,p.supplier);return row(item(p),h(p.category),'<b class="'+(p.stock<=p.minimum?'lowtext':'')+'">'+h(p.stock)+'</b>',rp(p.cost),rp(p.price),s?btn('contact',s.name,'phone','',s.id):'—',ib('product','Edit stok '+p.name,'edit',p.id))});
 }else if(page==='suplier'){
 headers=['Suplier','Kontak','Telepon','Produk dipasok',''];rows=d.suppliers.filter(s=>matches(s.name,s.contact)).map(s=>row('<button class="linkbtn" data-a="contact" data-id="'+h(s.id)+'">'+h(s.name)+'</button>',h(s.contact||'—'),h(s.phone||'—'),String(d.products.filter(p=>p.supplier===s.id).length),ib('supplier','Edit suplier','edit',s.id)));
 }else if(page==='pegawai'){
 headers=['Pegawai','Email','Akses menu','Status',''];rows=d.staff.filter(s=>matches(s.name,s.email)).map(s=>row('<b>'+h(s.name)+'</b>',h(s.email||'—'),s.owner?'Pemilik · semua menu':h(s.menus.map(m=>menus[m]).join(', ')||'Belum ada akses'),'<span class="status '+(s.active?'':'demo')+'">'+(s.active?'Aktif':'Nonaktif')+'</span>',s.owner?'':ib('employee','Edit pegawai','edit',s.id)));
 }else{
 headers=['No. struk','Waktu (WIB)','Kasir','Item','Metode','Total',''];rows=d.sales.filter(s=>matches(nomor(s),s.cashier,s.items.map(i=>i.name).join(' '))).map(s=>row('<b>'+h(nomor(s))+'</b>',date(s.at,{dateStyle:'medium',timeStyle:'short'}),h(s.cashier),s.items.reduce((n,i)=>n+i.qty,0),h(s.method),rp(s.total),btn('receipt','Struk','receipt','',s.id)));
 }
 return rows.length?table(headers,rows):empty(mg.search?'Tidak ada hasil pencarian':'Belum ada data',page==='riwayat'?'Transaksi yang selesai akan muncul di sini.':'');
}
export function productForm(p={},d){
 const f=(l,n,o={})=>field(l,n,p[n]??'',o),num=(l,n,v)=>field(l,n,p[n]??v,{type:'number',required:true,min:0,extra:'step="1" max="2147483647"'});
 return '<form id="productform"><div class="formgrid">'+f('Nama produk','name',{required:true,wide:true})+f('Kode SKU / barcode','sku',{required:true})+field('Kategori','category',p.category||categories[0],{items:categories})+f('Satuan penjualan','unit',{required:true,placeholder:'Strip, botol, kotak…'})+f('Isi / ukuran','detail',{placeholder:'Mis. 10 tablet'})+num('Harga beli per satuan (Rp)','cost',0)+num('Harga jual per satuan (Rp)','price',0)+num('Jumlah stok','stock',0)+num('Batas stok minimum','minimum',5)+field('Suplier','supplier',p.supplier,{items:[['','Pilih suplier'],...d.suppliers.map(s=>[s.id,s.name])],wide:true})+f('Nomor batch','batch')+f('Kedaluwarsa','expiry',{type:'date'})+'<label class="field wide">Foto produk<input class="control" type="file" name="upload" accept="image/jpeg,image/png,image/webp"></label></div>'+formEnd(p.id?'Simpan perubahan':'Tambah produk')+'</form>';
}
export function supplierForm(s={}){
 return '<form id="supplierform"><div class="formgrid">'+[['Nama suplier','name'],['Nama kontak','contact'],['Nomor telepon','phone'],['WhatsApp','wa'],['Email','email'],['Alamat','address']].map(([l,n])=>field(l,n,s[n],{required:n==='name',type:n==='email'?'email':['phone','wa'].includes(n)?'tel':'text',wide:n==='address',textarea:n==='address'})).join('')+'</div>'+formEnd()+'</form>';
}
export function employeeForm(s={active:true,menus:['kasir']}){
 return '<form id="employeeform"><div class="formgrid">'+field('Nama pegawai','name',s.name,{required:true,wide:true})+field('Email akun Supabase','email',s.email,{type:'email',required:true,wide:true})+'<div class="wide"><b>Akses menu</b><div class="checks sectiongap">'+Object.entries(menus).filter(([m])=>m!=='pegawai').map(([m,l])=>'<label><input type="checkbox" name="menus" value="'+m+'" '+(s.menus.includes(m)?'checked':'')+'>'+h(l)+'</label>').join('')+'</div></div><label class="checkline wide"><input type="checkbox" name="active" '+(s.active?'checked':'')+'>Akun aktif</label></div><p class="note">Gunakan email yang sama saat pegawai mendaftar dan mengonfirmasi akun di halaman masuk.</p>'+formEnd()+'</form>';
}
function dial(v){let n=String(v||'').replace(/[^0-9+]/g,'');return /^\+?\d{6,16}$/.test(n)?n:''}
export function contact(s,products){
 let phone=dial(s.phone),wa=dial(s.wa||s.phone).replace(/^0/,'62').replace(/^\+/,'');
 return line('Kontak',s.contact||'—')+line('Telepon',s.phone||'—')+line('WhatsApp',s.wa||'—')+line('Email',s.email||'—')+line('Alamat',s.address||'—')+'<div class="tools sectiongap">'+(phone?'<a class="btn" href="tel:'+phone+'">'+icon('phone')+' Telepon</a>':'')+(wa?'<a class="btn" href="https://wa.me/'+wa+'" target="_blank" rel="noopener">'+icon('chat')+' WhatsApp</a>':'')+'</div>'+(!wa&&!phone?'<p class="note">Isi nomor telepon atau WhatsApp di detail suplier untuk menghubungi.</p>':'')+'<h3>Produk yang dipasok</h3>'+ (products.filter(p=>p.supplier===s.id).map(p=>line(p.name,p.stock+' '+p.unit.toLowerCase())).join('')||'<p class="note">Belum ada produk dari suplier ini.</p>');
}
function filtered(d){const {period,day,month,year}=mg;let prefix=period==='jam'?day:period==='hari'?month:period==='bulan'?year:'';return d.sales.filter(s=>atDate(s.at).startsWith(prefix))}
function aggregate(sales){let a={total:0,cost:0,discount:0,qty:0,sub:0},products=new Map(),groups=new Map(),methods=new Map();
 for(const s of sales){a.total+=s.total;a.cost+=s.cost;a.discount+=s.discount;a.sub+=s.subtotal;methods.set(s.method,(methods.get(s.method)||0)+s.total);
 const key=atDate(s.at).slice(0,({jam:13,hari:10,bulan:7,tahun:4}[mg.period]));groups.set(key,(groups.get(key)||0)+s.total);
 for(const i of s.items){a.qty+=i.qty;let p=products.get(i.id)||{name:i.name,qty:0,sub:0};p.qty+=i.qty;p.sub+=i.qty*i.price;products.set(i.id,p)}}
 return {a,products,groups,methods};
}
export function reports(d){
 let sales=filtered(d),{a,products,groups,methods}=aggregate(sales);
 const period=mg.period,select=field('Kelompokkan','period',period,{items:[['jam','Per jam'],['hari','Per hari'],['bulan','Per bulan'],['tahun','Per tahun']]}),range=period==='tahun'?'':field({jam:'Tanggal',hari:'Bulan',bulan:'Tahun'}[period],'range',mg[{jam:'day',hari:'month',bulan:'year'}[period]],{type:{jam:'date',hari:'month',bulan:'number'}[period],extra:period==='bulan'?'min="2000" max="9999"':''});
 const max=Math.max(1,...groups.values());let bars=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>'<div class="barrow"><span>'+h(period==='jam'?k.slice(-2)+'.00 WIB':k)+'</span><div class="track"><i style="width:'+v/max*100+'%"></i></div><b>'+rp(v)+'</b></div>').join('');
 const stats=[['Penjualan bersih',rp(a.total)],['Laba kotor',rp(a.total-a.cost)],['Transaksi',sales.length],['Produk terjual',a.qty]];
 return head('Laporan penjualan','Pantau omzet, harga pokok, dan keuntungan apotek.',btn('export','Ekspor CSV','download'))+'<div class="stack"><div class="panel tools">'+select+range+'<span class="small">Zona waktu WIB</span></div><div class="stats">'+stats.map(([l,v])=>'<div class="stat"><span>'+l+'</span><b>'+v+'</b></div>').join('')+'</div><div class="panel"><h2>Penjualan per '+period+'</h2>'+(bars?'<div class="rangebars">'+bars+'</div>':empty('Belum ada penjualan pada periode ini'))+'</div><div class="split"><div class="panel"><div class="panelhead"><h2>Rincian penjualan</h2></div>'+line('Penjualan sebelum diskon',rp(a.sub))+line('Diskon',rp(a.discount))+line('Harga pokok penjualan',rp(a.cost))+line('Laba kotor',rp(a.total-a.cost))+line('Margin kotor',a.total?((a.total-a.cost)/a.total*100).toFixed(1)+'%':'—')+'</div><div class="panel"><div class="panelhead"><h2>Metode pembayaran</h2></div>'+([...methods].map(([m,v])=>line(m,rp(v))).join('')||'<span class="small">Belum ada pembayaran.</span>')+'</div></div><div class="panel"><div class="panelhead"><h2>Produk terlaris</h2></div>'+(products.size?table(['Produk','Jumlah terjual','Penjualan sebelum diskon'],[...products.values()].sort((a,b)=>b.qty-a.qty).map(p=>row(h(p.name),p.qty,rp(p.sub)))):empty('Belum ada produk terjual'))+'</div></div>';
}
export function exportCsv(d){
 const cells=v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';
 const rows=[['No. struk','Waktu WIB','Kasir','Metode','Unit','Penjualan kotor','Diskon','Penjualan bersih','Harga pokok','Laba kotor'],...filtered(d).map(s=>[nomor(s),date(s.at,{dateStyle:'short',timeStyle:'medium'}),s.cashier,s.method,s.items.reduce((n,i)=>n+i.qty,0),s.subtotal,s.discount,s.total,s.cost,s.total-s.cost])];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cells).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));let a=document.createElement('a');a.href=url;a.download='laporan-penjualan-'+today()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
