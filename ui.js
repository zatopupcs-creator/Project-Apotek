const ApotekUI = (() => {
  const {icon} = ApotekIcons;
  globalThis.apotekBroken=img=>{const s=document.createElement('span');s.className='fallback';s.innerHTML=icon('pill',38);img.replaceWith(s)};
  const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rp=n=>'Rp'+new Intl.NumberFormat('id-ID').format(Number(n)||0);
  const date=(v,opts={day:'numeric',month:'short',year:'numeric'})=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',...opts}).format(new Date(v));
  const nomor=s=>'TRX-'+String(s.number).padStart(5,'0');
  const btn=(action,label,ico='',cls='',id='',attrs='')=>'<button type="button" data-a="'+h(action)+'" data-id="'+h(id)+'" class="btn '+cls+'" '+attrs+'>'+(ico?icon(ico,17):'')+h(label)+'</button>';
  const ib=(action,label,ico,id='',cls='iconbtn')=>'<button type="button" title="'+h(label)+'" aria-label="'+h(label)+'" data-a="'+h(action)+'" data-id="'+h(id)+'" class="'+cls+'">'+icon(ico,17)+'</button>';
  const field=(label,name,value='',options={})=>{let {type='text',wide=false,required=false,items,textarea=false,min,placeholder='',extra=''}=options;
   const attrs=' name="'+h(name)+'" class="control" '+(required?'required ':'')+(min!=null?'min="'+h(min)+'" ':'')+extra;
   let control;
   if(items){
    const opts=items.map(x=>Array.isArray(x)?[String(x[0]),String(x[1])]:[String(x),String(x)]),cur=opts.find(([v])=>v===String(value))||opts[0];
    control='<div class="selectbox"><input type="hidden" name="'+h(name)+'" value="'+h(cur[0])+'" data-options="'+h(JSON.stringify(opts))+'"><button type="button" class="control selbtn" aria-haspopup="listbox" aria-expanded="false"><span>'+h(cur[1])+'</span>'+icon('down',16)+'</button></div>';
   }else if(type==='date'){
    control='<div class="selectbox"><input type="hidden" name="'+h(name)+'" value="'+h(value)+'"><button type="button" class="control selbtn datebtn" data-dp="single" aria-haspopup="dialog"><span class="'+(value?'':'ph')+'">'+h(value?ApotekDates.label(value):(placeholder||'Pilih tanggal'))+'</span>'+icon('calendar',17)+'</button></div>';
   }else control=textarea?'<textarea rows="3"'+attrs+'>'+h(value)+'</textarea>':'<input type="'+type+'" value="'+h(value)+'" placeholder="'+h(placeholder)+'"'+attrs+'>';
   return '<label class="field '+(wide?'wide':'')+'">'+h(label)+control+'</label>';};
  const head=(title,action='')=>'<div class="pagehead"><div><h1>'+h(title)+'</h1></div>'+action+'<button type="button" class="bellbtn" data-a="notif" aria-label="Pengingat kedaluwarsa" hidden>'+icon('bell',20)+'<span class="bellbadge" hidden></span></button></div>';
  const empty=(title,desc='')=>'<div class="empty">'+icon('box',28)+'<strong>'+h(title)+'</strong>'+h(desc)+'</div>';
  const line=(label,value,cls='')=>'<div class="line '+cls+'"><span>'+h(label)+'</span><b>'+h(value)+'</b></div>';
  function photo(p){let img=p.image||'';return /^(assets\/[\w-]+\.jpg$|data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$)/i.test(img)?'<img alt="'+h(p.name)+'" src="'+h(img)+'" loading="lazy" onerror="apotekBroken(this)">':'<span class="fallback">'+icon('pill',38)+'</span>'}
  const table=(headers,rows)=>'<div class="tablewrap"><table><thead><tr>'+headers.map(x=>'<th>'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>{let i=0;return r.replace(/<td>/g,()=>'<td data-label="'+h(headers[i++]||'')+'">')}).join('')+'</tbody></table></div>';
  const row=(...cells)=>'<tr>'+cells.map(x=>'<td>'+x+'</td>').join('')+'</tr>';
  function logoUrl(value){
   return typeof value==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)?value:'';
  }
  function ticket(s){
   const b=s.business||{}, logo=logoUrl(b.logo);
   const text=value=>value?'<p>'+h(value)+'</p>':'';
   const when=date(s.at,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
   return '<section class="ticket" data-width="'+(b.width==='58'?'58':'80')+'">'+
    (logo&&b.showLogo!==false?'<img class="ticket-logo" alt="Logo apotek" src="'+logo+'">':'')+
    '<h3>'+h(b.name)+'</h3>'+text(b.address)+text(b.phone)+text(b.headerText)+
    (b.receiptTitle?'<h4>'+h(b.receiptTitle)+'</h4>':'')+'<hr>'+
    line('No. struk',nomor(s))+line('Waktu',when)+(b.showCashier!==false?line('Kasir',s.cashier):'')+'<hr>'+
    s.items.map(i=>'<div class="ticketitem">'+h(i.name)+line(i.qty+' × '+rp(i.price),rp(i.qty*i.price))+'</div>').join('')+
    '<hr>'+line('Subtotal',rp(s.subtotal))+line('Diskon',rp(s.discount))+line('TOTAL',rp(s.total))+
    line(s.method,rp(s.paid))+line('Kembali',rp(s.change))+'<hr>'+text(b.footer)+'</section>';
  }
  const search=(id,value,placeholder)=>'<label class="searchbox"><input type="search" id="'+id+'" aria-label="'+h(placeholder)+'" placeholder="'+h(placeholder)+'" value="'+h(value)+'" enterkeyhint="search"><button type="button" class="searchgo" data-a="searchgo" data-id="'+id+'" aria-label="Cari">'+icon('search',18)+'</button></label>';
  const formEnd=(label='Simpan')=>'<p class="error" role="alert"></p><div class="actions">'+btn('close','Batal')+'<button class="btn primary" type="submit">'+h(label)+'</button></div>';
return { h, rp, date, nomor, btn, ib, field, head, empty, line, photo, table, row, logoUrl, ticket, search, formEnd, icon };
})();
