const ApotekManagement = (() => {
  const {h,rp,date,nomor,head,empty,table,row,btn,ib,photo,line,field,search,icon,formEnd} = ApotekUI;
  const {categories,menus} = ApotekData;
  const atDate=s=>new Date(new Date(s).getTime()+7*3600000).toISOString();
  const today=()=>atDate(Date.now()).slice(0,10);
  const mg={search:'',period:'hari',preset:'bulan',size:10,pg:{},...ApotekDates.presetRange('bulan')};
  const find=(array,id)=>array.find(x=>x.id===id);
  const matches=(...values)=>values.join(' ').toLowerCase().includes(mg.search.toLowerCase());
  const pic=p=>'<span class="thumb">'+photo(p)+'</span>';
  const item=p=>'<div class="tableproduct">'+pic(p)+'<div><b>'+h(p.name)+'</b><small>'+h(p.sku)+' · '+h(p.unit)+'</small></div></div>';
  const daysLeft=v=>{if(!v)return null;const a=ApotekDates.parse(v),b=ApotekDates.parse(today());return Math.round((Date.UTC(a.y,a.m,a.d)-Date.UTC(b.y,b.m,b.d))/864e5)};
  const shortDate=v=>{const {y,m,d}=ApotekDates.parse(v);return d+' '+ApotekDates.SHORT[m]+' '+y};
  const expiryState=days=>days<0?['expired','Kedaluwarsa']:days===0?['danger','Hari ini']:days<=7?['danger',days+' hari lagi']:days<=30?['warn',days+' hari lagi']:null;
  const expiryCell=p=>{
   if(!p.expiry)return '—';
   const state=expiryState(daysLeft(p.expiry));
   return '<div class="expcell"><span>'+shortDate(p.expiry)+'</span>'+(state?'<small class="expbadge '+state[0]+'">'+state[1]+'</small>':'')+'</div>';
  };
  const expiring=(d,skip)=>d.products.filter(p=>p.expiry).map(p=>({p,days:daysLeft(p.expiry),key:p.id+'|'+p.expiry})).filter(x=>x.days<=30&&!(skip&&skip.has(x.key))).sort((a,b)=>a.days-b.days);
  function expiryRows(items,st){
   return items.map(({p,days,key})=>{
    const state=expiryState(days);
    const cell='<div class="expcell"><span>'+shortDate(p.expiry)+'</span><small class="expbadge '+state[0]+'">'+state[1]+'</small></div>';
    const info='<div class="expinfo"><b>'+h(p.name)+'</b><small>'+(p.batch?'Batch '+h(p.batch)+' · ':'')+'Stok '+h(p.stock)+'</small></div>';
    if(st.selecting){
     const on=st.selected.has(key);
     return '<div class="expwrap"><div class="expitem selecting'+(on?' on':'')+'" role="checkbox" aria-checked="'+on+'" tabindex="0" data-a="expcheck" data-id="'+h(key)+'"><span class="expbox">'+(on?icon('check',14):'')+'</span>'+info+cell+'</div></div>';
    }
    return '<div class="expwrap"><div class="expbg" aria-hidden="true">'+icon('trash',18)+'<span>Hapus</span></div><div class="expitem" data-key="'+h(key)+'">'+info+cell+ib('expdel','Hapus pengingat '+p.name,'trash',key)+'</div></div>';
   }).join('');
  }
  function expiryInner(items,st){
   const restore=st.restorable?'<button type="button" class="btn" data-a="expreset">Pulihkan ('+st.restorable+')</button>':'';
   if(!items.length)return empty('Tidak ada pengingat','Produk yang kedaluwarsa dalam 30 hari akan muncul di sini.')+(restore?'<div class="exptools center">'+restore+'</div>':'')+'<div class="actions"><button type="button" class="btn" data-a="close">Tutup</button></div>';
   const all=items.every(x=>st.selected.has(x.key));
   const tools=st.selecting
    ?'<div class="exptools"><span class="expcount">'+st.selected.size+' dipilih</span><div class="expbtns"><button type="button" class="btn" data-a="expall">'+(all?'Batal pilih semua':'Pilih semua')+'</button><button type="button" class="btn danger" data-a="expdelsel"'+(st.selected.size?'':' disabled')+'>Hapus</button><button type="button" class="btn" data-a="expselect">Batal</button></div></div>'
    :'<div class="exptools"><span class="expcount">'+items.length+' pengingat</span><div class="expbtns"><button type="button" class="btn" data-a="expselect">Pilih</button><button type="button" class="btn danger" data-a="expclear">Hapus semua</button>'+restore+'</div></div>';
   return tools+'<div class="explist">'+expiryRows(items,st)+'</div><div class="actions"><button type="button" class="btn" data-a="close">Tutup</button><button type="button" class="btn dark" data-a="expgo">Lihat stok</button></div>';
  }
  const expiryNotice=(items,st)=>'<div id="expbox">'+expiryInner(items,st)+'</div>';
  const sizes=[10,25,50,100];
  function pageList(cur,total){
   if(total<=5)return Array.from({length:total},(_,i)=>i+1);
   const set=new Set([1,total,cur-1,cur,cur+1]),out=[];
   [...set].filter(n=>n>=1&&n<=total).sort((a,b)=>a-b).forEach((n,i,a)=>{if(i&&n-a[i-1]>1)out.push('…');out.push(n)});
   return out;
  }
  function pager(key,cur,pages,total,from,count,noun){
   const arrow=(to,off,label,deg)=>'<button type="button" class="pgarrow" data-a="pgto" data-id="'+key+':'+to+'" aria-label="'+label+'"'+(off?' disabled':'')+'>'+icon('down',16).replace('<svg','<svg style="transform:rotate('+deg+'deg)"')+'</button>';
   const nums=pageList(cur,pages).map(n=>n==='…'?'<span class="pgdots" aria-hidden="true">…</span>':'<button type="button" class="pgnum'+(n===cur?' on':'')+'" data-a="pgto" data-id="'+key+':'+n+'" aria-label="Halaman '+n+'"'+(n===cur?' aria-current="page"':'')+'>'+n+'</button>').join('');
   const opts=sizes.map(n=>[String(n),String(n)]);
   const size='<div class="selectbox pgsel"><input type="hidden" name="pgsize" value="'+mg.size+'" data-options="'+h(JSON.stringify(opts))+'"><button type="button" class="control selbtn" aria-haspopup="listbox" aria-expanded="false" aria-label="Baris per halaman"><span>'+mg.size+'</span>'+icon('down',16)+'</button></div>';
   return '<div class="pager"><span class="pgtext">Menampilkan '+(from+1)+'–'+(from+count)+' dari '+total+' '+noun+'</span><div class="pgctrl"><span class="pglabel">Baris per halaman</span>'+size+'<div class="pgnav">'+arrow(cur-1,cur<=1,'Halaman sebelumnya',90)+nums+arrow(cur+1,cur>=pages,'Halaman berikutnya',-90)+'</div></div></div>';
  }
  function paginate(key,noun,items){
   const size=mg.size,pages=Math.max(1,Math.ceil(items.length/size)),cur=Math.min(Math.max(1,mg.pg[key]||1),pages),from=(cur-1)*size,slice=items.slice(from,from+size);
   mg.pg[key]=cur;
   return {items:slice,html:pager(key,cur,pages,items.length,from,slice.length,noun)};
  }
  function paged(key,noun,headers,rows){
   const p=paginate(key,noun,rows);
   return table(headers,p.items)+p.html;
  }
  function goPage(key,n){mg.pg[key]=Math.max(1,n)}
  function management(page,d){
   if(page==='laporan')return reports(d);
   let title=menus[page];
   const add={stok:['product','Tambah produk'],suplier:['supplier','Tambah suplier'],pegawai:['employee','Tambah pegawai']}[page];
   return head(title,add?btn(add[0],add[1],'plus','dark'):'')+'<div class="panel"><div class="panelhead">'+search('mgsearch',mg.search,'Cari '+({stok:'nama produk atau SKU',suplier:'nama suplier',pegawai:'nama, username, atau ID',riwayat:'nomor struk atau kasir'}[page])+'…')+'</div><div id="mgrows">'+managementRows(page,d)+'</div></div>';
  }
  function managementRows(page,d){
   let headers,rows,noun;
   if(page==='stok'){noun='produk';
   headers=['Produk','Kategori','Stok','Kedaluwarsa','Harga beli','Harga jual','Suplier',''];rows=d.products.filter(p=>matches(p.name,p.sku,p.category)).map(p=>{let s=find(d.suppliers,p.supplier);return row(item(p),h(p.category),'<b class="'+(p.stock<=p.minimum?'lowtext':'')+'">'+h(p.stock)+'</b>',expiryCell(p),'<span class="nw">'+rp(p.cost)+'</span>','<span class="nw">'+rp(p.price)+'</span>',s?btn('contact',s.name,'phone','',s.id):'—','<div class="rowactions">'+ib('product','Edit stok '+p.name,'edit',p.id)+ib('deleteproduct','Hapus '+p.name,'trash',p.id)+'</div>')});
   }else if(page==='suplier'){noun='suplier';
   headers=['Suplier','Kontak','Telepon','Produk dipasok',''];rows=d.suppliers.filter(s=>matches(s.name,s.contact)).map(s=>row('<button class="linkbtn" data-a="contact" data-id="'+h(s.id)+'">'+h(s.name)+'</button>',h(s.contact||'—'),h(s.phone||'—'),String(d.products.filter(p=>p.supplier===s.id).length),ib('supplier','Edit suplier','edit',s.id)));
   }else if(page==='pegawai'){noun='akun';
   headers=['Pegawai','Username','ID pegawai','Akses menu','Status',''];
   rows=d.staff.filter(s=>matches(s.name,s.username,s.employee_code)).map(s=>{
    const status=!s.active?'Nonaktif':s.provisioned?'Aktif':'Perlu aktivasi';
    return row('<b>'+h(s.name)+'</b>',h(s.username||'—'),h(s.employee_code||'—'),
     s.owner?'Pemilik':h(s.menus.map(m=>menus[m]).join(', ')||'Belum ada akses'),
     '<span class="status '+(status==='Aktif'?'':'demo')+'">'+status+'</span>',ib('employee','Edit akun '+s.name,'edit',s.id));
   });
   }else{noun='transaksi';
   headers=['No. struk','Waktu','Kasir','Item','Metode','Total',''];rows=d.sales.filter(s=>matches(nomor(s),s.cashier,s.items.map(i=>i.name).join(' '))).map(s=>row('<b>'+h(nomor(s))+'</b>',date(s.at,{dateStyle:'medium',timeStyle:'short'}),h(s.cashier),s.items.reduce((n,i)=>n+i.qty,0),h(s.method),rp(s.total),btn('receipt','Struk','receipt','',s.id)));
   }
   return rows.length?paged(page,noun,headers,rows):empty(mg.search?'Tidak ada hasil pencarian':'Belum ada data',page==='riwayat'?'Transaksi yang selesai akan muncul di sini.':'');
  }
  function productForm(p={},d){
   const f=(l,n,o={})=>field(l,n,p[n]??'',o),num=(l,n,v)=>field(l,n,p[n]??v,{type:'number',required:true,min:0,extra:'step="1" max="2147483647"'});
   return '<form id="productform"><div class="formgrid">'+f('Nama produk','name',{required:true,wide:true})+f('Kode SKU / barcode','sku',{required:true})+field('Kategori','category',p.category||categories[0],{items:categories})+f('Satuan penjualan','unit',{required:true,placeholder:'Strip, botol, kotak…'})+f('Isi / ukuran','detail',{placeholder:'Mis. 10 tablet'})+num('Harga beli per satuan (Rp)','cost',0)+num('Harga jual per satuan (Rp)','price',0)+num('Jumlah stok','stock',0)+num('Batas stok minimum','minimum',5)+field('Suplier','supplier',p.supplier,{items:[['','Pilih suplier'],...d.suppliers.map(s=>[s.id,s.name])],wide:true})+f('Nomor batch','batch')+f('Kedaluwarsa','expiry',{type:'date'})+'<label class="field wide">Foto produk<input class="control" type="file" name="upload" accept="image/jpeg,image/png,image/webp"></label></div>'+formEnd(p.id?'Simpan perubahan':'Tambah produk')+'</form>';
  }
  function supplierForm(s={}){
   return '<form id="supplierform"><div class="formgrid">'+[['Nama suplier','name'],['Nama kontak','contact'],['Nomor telepon','phone'],['WhatsApp','wa'],['Email','email'],['Alamat','address']].map(([l,n])=>field(l,n,s[n],{required:n==='name',type:n==='email'?'email':['phone','wa'].includes(n)?'tel':'text',wide:n==='address',textarea:n==='address'})).join('')+'</div>'+formEnd()+'</form>';
  }
  function employeeForm(s={active:true,menus:['kasir']},d){
   const used=new Set(d.staff.flatMap(p=>[p.employee_code,p.username]).filter(Boolean).map(x=>x.toLowerCase()));
   let n=1;while(used.has('pg-'+String(n).padStart(3,'0')))n++;
   const aliasOpts={required:true,extra:'maxlength="32" autocapitalize="none" spellcheck="false"'};
   const permissions=s.owner?'<p class="note wide">Pemilik memiliki akses ke seluruh menu.</p>':
    '<div class="wide"><b>Akses menu</b><div class="checks sectiongap">'+Object.entries(menus).filter(([m])=>m!=='pegawai').map(([m,l])=>'<label><input type="checkbox" name="menus" value="'+m+'" '+(s.menus.includes(m)?'checked':'')+'>'+h(l)+'</label>').join('')+
    '</div></div><label class="checkline wide"><input type="checkbox" name="active" '+(s.active?'checked':'')+'>Akun aktif</label>';
   return '<form id="employeeform"><div class="formgrid">'+field('Nama','name',s.name,{required:true,wide:true})+
    field('Username','username',s.username,aliasOpts)+field('ID pegawai','employee_code',s.employee_code||'PG-'+String(n).padStart(3,'0'),aliasOpts)+
    (!s.id?field('Kata sandi','password','',{type:'password',wide:true,required:true,extra:'autocomplete="new-password" minlength="8"',placeholder:'Minimal 8 karakter'}):'')+permissions+
    '</div>'+(s.id?(!s.username||!s.employee_code?'<p class="note">Simpan username dan ID pegawai, lalu buka kembali akun ini untuk mengaktifkan login.</p>':s.managed_password||!s.provisioned?'<div class="sectiongap">'+btn('password',s.provisioned?'Ganti kata sandi':'Aktifkan login','user','',s.id)+'</div>':'<p class="note">Akun ini menggunakan kata sandi yang sudah terdaftar di Supabase Authentication.</p>'):'')+
    formEnd(s.id?'Simpan perubahan':'Daftarkan akun')+'</form>';
  }
  function dial(v){let n=String(v||'').replace(/[^0-9+]/g,'');return /^\+?\d{6,16}$/.test(n)?n:''}
  function contact(s,products){
   let phone=dial(s.phone),wa=dial(s.wa||s.phone).replace(/^0/,'62').replace(/^\+/,'');
   return line('Kontak',s.contact||'—')+line('Telepon',s.phone||'—')+line('WhatsApp',s.wa||'—')+line('Email',s.email||'—')+line('Alamat',s.address||'—')+'<div class="tools sectiongap">'+(phone?'<a class="btn" href="tel:'+phone+'">'+icon('phone')+' Telepon</a>':'')+(wa?'<a class="btn" href="https://wa.me/'+wa+'" target="_blank" rel="noopener">'+icon('chat')+' WhatsApp</a>':'')+'</div>'+(!wa&&!phone?'<p class="note">Isi nomor telepon atau WhatsApp di detail suplier untuk menghubungi.</p>':'')+'<h3>Produk yang dipasok</h3>'+ (products.filter(p=>p.supplier===s.id).map(p=>line(p.name,p.stock+' '+p.unit.toLowerCase())).join('')||'<p class="note">Belum ada produk dari suplier ini.</p>');
  }
  function filtered(d){
   if(mg.preset==='semua'||!mg.from||!mg.to)return d.sales;
   const a=ApotekDates.ms(mg.from,false),b=ApotekDates.ms(mg.to,true);
   return d.sales.filter(s=>{const t=new Date(s.at).getTime();return t>=a&&t<=b});
  }
  const rangeText=()=>mg.preset==='semua'||!mg.from?'Semua tanggal':ApotekDates.label(mg.from)+' → '+ApotekDates.label(mg.to);
  const rangeShort=()=>{
   if(mg.preset==='semua'||!mg.from)return 'Semua tanggal';
   const D=ApotekDates,f=mg.from,t=mg.to||mg.from,fd=f.slice(0,10),td=t.slice(0,10),ft=f.slice(11,16),tt=t.slice(11,16);
   const p=D.parse(fd),q=D.parse(td),dm=x=>x.d+' '+D.SHORT[x.m],full=(!ft||ft==='00:00')&&(!tt||tt==='23:59');
   if(full)return fd===td?dm(p)+' '+p.y:p.y===q.y?dm(p)+' – '+dm(q)+' '+q.y:dm(p)+' '+p.y+' – '+dm(q)+' '+q.y;
   return dm(p)+(p.y===q.y?'':' '+p.y)+', '+ft+' – '+dm(q)+' '+q.y+', '+tt;
  };
  function aggregate(sales){let a={total:0,cost:0,discount:0,qty:0,sub:0},products=new Map(),groups=new Map(),methods=new Map();
   for(const s of sales){a.total+=s.total;a.cost+=s.cost;a.discount+=s.discount;a.sub+=s.subtotal;methods.set(s.method,(methods.get(s.method)||0)+s.total);
   const key=atDate(s.at).slice(0,({jam:13,hari:10,bulan:7,tahun:4}[mg.period]));groups.set(key,(groups.get(key)||0)+s.total);
   for(const i of s.items){a.qty+=i.qty;
    const line=i.qty*i.price,share=s.subtotal?line/s.subtotal:0;
    const cost=Number.isFinite(i.cost)?i.cost*i.qty:(s.cost||0)*share;
    const final=line-(s.discount||0)*share;
    let p=products.get(i.id)||{name:i.name,qty:0,sub:0,cost:0,final:0};p.qty+=i.qty;p.sub+=line;p.cost+=cost;p.final+=final;products.set(i.id,p)}}
   return {a,products,groups,methods};
  }
  function reports(d){
   let sales=filtered(d),{a,products,groups,methods}=aggregate(sales);
   const period='hari';
   const first=d.sales.reduce((n,x)=>Math.min(n,new Date(x.at).getTime()),Infinity),since=Number.isFinite(first)?ApotekDates.wall(first).slice(0,10):'';
   const rangeBtn='<div class="fieldbox"><span>Rentang waktu</span><button type="button" class="control selbtn rangebtn" data-dp="range" data-since="'+h(since)+'" aria-haspopup="dialog">'+icon('calendar',17)+'<span><span class="dlong">'+h(rangeText())+'</span><span class="dshort">'+h(rangeShort())+'</span></span>'+icon('down',16)+'</button></div>';
   const max=Math.max(1,...groups.values());const oneDay=new Set([...groups.keys()].map(k=>k.slice(0,10))).size<2;let bars=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>'<div class="barrow"><span>'+h(period==='jam'?(oneDay?'':k.slice(8,10)+'/'+k.slice(5,7)+' ')+k.slice(11,13)+'.00':k)+'</span><div class="track"><i style="width:'+v/max*100+'%"></i></div><b>'+rp(v)+'</b></div>').join('');
   const stats=[['Penjualan bersih',rp(a.total)],['Laba kotor',rp(a.total-a.cost)],['Transaksi',sales.length],['Produk terjual',a.qty]];
   return head('Laporan penjualan',btn('export','Ekspor','download'))+'<div class="stack"><div class="panel reportfilters">'+rangeBtn+'</div><div class="stats">'+stats.map(([l,v])=>'<div class="stat"><span>'+l+'</span><b>'+v+'</b></div>').join('')+'</div><div class="panel"><h2>Penjualan per '+period+'</h2>'+(bars?'<div class="rangebars">'+bars+'</div>':empty('Belum ada penjualan pada periode ini'))+'</div><div class="split"><div class="panel"><div class="panelhead"><h2>Rincian penjualan</h2></div>'+line('Penjualan sebelum diskon',rp(a.sub))+line('Diskon',rp(a.discount))+line('Harga pokok penjualan',rp(a.cost))+line('Laba kotor',rp(a.total-a.cost))+line('Margin kotor',a.total?((a.total-a.cost)/a.total*100).toFixed(1)+'%':'—')+'</div><div class="panel"><div class="panelhead"><h2>Metode pembayaran</h2></div>'+([...methods].map(([m,v])=>line(m,rp(v))).join('')||'<span class="small">Belum ada pembayaran.</span>')+'</div></div><div class="panel"><div class="panelhead"><h2>Produk terlaris</h2></div>'+(products.size?paged('laporan','produk',['Produk','Jumlah terjual','Penjualan sebelum diskon','Harga awal','Harga akhir','Untung'],[...products.values()].sort((a,b)=>b.qty-a.qty).map(p=>row(h(p.name),p.qty,rp(p.sub),rp(Math.round(p.cost)),rp(Math.round(p.final)),'<b class="'+(p.final-p.cost<0?'lowtext':'')+'">'+rp(Math.round(p.final-p.cost))+'</b>'))).replace('class="tablewrap"','class="tablewrap nums"'):empty('Belum ada produk terjual'))+'</div></div>';
  }
  function download(blob,name){
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function exportChooser(){
   const opt=(a,ico,t,sub)=>'<button type="button" class="exportopt" data-a="'+a+'"><span class="exporticon">'+icon(ico,22)+'</span><span><b>'+t+'</b><small>'+sub+'</small></span></button>';
   return '<p class="note">Periode: <b>'+h(rangeText())+'</b></p><div class="exportopts">'+opt('export-pdf','receipt','PDF','Laporan siap cetak dengan ringkasan dan rincian transaksi')+opt('export-csv','download','CSV','Data mentah untuk dibuka di Excel atau Google Sheets')+'</div>';
  }
  function exportCsv(d){
   const cells=v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';
   const rows=[['No. struk','Waktu','Kasir','Metode','Unit','Penjualan kotor','Diskon','Penjualan bersih','Harga pokok','Laba kotor'],...filtered(d).map(s=>[nomor(s),date(s.at,{dateStyle:'short',timeStyle:'medium'}),s.cashier,s.method,s.items.reduce((n,i)=>n+i.qty,0),s.subtotal,s.discount,s.total,s.cost,s.total-s.cost])];
   download(new Blob(['\uFEFF'+rows.map(r=>r.map(cells).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'laporan-penjualan-'+today()+'.csv');
  }
  function exportPdf(d){
   const sales=filtered(d),{a,products,methods}=aggregate(sales);
   const model={brand:d.settings.name||'Apotek',period:rangeText(),printed:ApotekDates.label(ApotekDates.nowWall()),
    stats:[['Penjualan bersih',rp(a.total)],['Laba kotor',rp(a.total-a.cost)],['Transaksi',String(sales.length)],['Produk terjual',String(a.qty)],['Penjualan sebelum diskon',rp(a.sub)],['Diskon',rp(a.discount)],['Harga pokok',rp(a.cost)],['Margin kotor',a.total?((a.total-a.cost)/a.total*100).toFixed(1)+'%':'-']],
    methods:[...methods].map(([m,v])=>[m,rp(v)]),
    top:[...products.values()].sort((x,y)=>y.qty-x.qty).slice(0,10).map(p=>[p.name,String(p.qty),rp(p.sub),rp(Math.round(p.cost)),rp(Math.round(p.final)),rp(Math.round(p.final-p.cost))]),
    rows:sales.map(s=>[nomor(s),date(s.at,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),s.cashier,s.method,String(s.items.reduce((n,i)=>n+i.qty,0)),rp(s.total),rp(s.total-s.cost)])};
   download(ApotekPdf.report(model),'laporan-penjualan-'+today()+'.pdf');
  }
return { today, mg, goPage, expiring, expiryNotice, expiryInner, management, managementRows, productForm, supplierForm, employeeForm, contact, reports, exportCsv, exportPdf, exportChooser };
})();
