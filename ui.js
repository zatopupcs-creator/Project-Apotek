import {icon} from './icons.js';
export {icon};
export const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const rp=n=>'Rp'+new Intl.NumberFormat('id-ID').format(Number(n)||0);
export const date=(v,opts={day:'numeric',month:'short',year:'numeric'})=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',...opts}).format(new Date(v));
export const nomor=s=>'TRX-'+String(s.number).padStart(5,'0');
export const btn=(action,label,ico='',cls='',id='',attrs='')=>'<button type="button" data-a="'+h(action)+'" data-id="'+h(id)+'" class="btn '+cls+'" '+attrs+'>'+(ico?icon(ico,17):'')+h(label)+'</button>';
export const ib=(action,label,ico,id='',cls='iconbtn')=>'<button type="button" title="'+h(label)+'" aria-label="'+h(label)+'" data-a="'+h(action)+'" data-id="'+h(id)+'" class="'+cls+'">'+icon(ico,17)+'</button>';
export const field=(label,name,value='',options={})=>{let {type='text',wide=false,required=false,items,textarea=false,min,placeholder='',extra=''}=options;
 const attrs=' name="'+h(name)+'" class="control" '+(required?'required ':'')+(min!=null?'min="'+h(min)+'" ':'')+extra;
 const control=items?'<select'+attrs+'>'+items.map(x=>{let [v,l]=Array.isArray(x)?x:[x,x];return '<option value="'+h(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+h(l)+'</option>'}).join('')+'</select>':textarea?'<textarea rows="3"'+attrs+'>'+h(value)+'</textarea>':'<input type="'+type+'" value="'+h(value)+'" placeholder="'+h(placeholder)+'"'+attrs+'>';
 return '<label class="field '+(wide?'wide':'')+'">'+h(label)+control+'</label>';};
export const head=(title,desc,action='')=>'<div class="pagehead"><div><h1>'+h(title)+'</h1><p>'+h(desc)+'</p></div>'+action+'</div>';
export const empty=(title,desc='')=>'<div class="empty">'+icon('box',28)+'<strong>'+h(title)+'</strong>'+h(desc)+'</div>';
export const line=(label,value,cls='')=>'<div class="line '+cls+'"><span>'+h(label)+'</span><b>'+h(value)+'</b></div>';
export function photo(p){let img=p.image||'';return /^(assets\/[\w-]+\.jpg$|data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$)/i.test(img)?'<img alt="'+h(p.name)+'" src="'+h(img)+'">':'<span class="fallback">'+icon('pill',38)+'</span>'}
export const table=(headers,rows)=>'<div class="tablewrap"><table><thead><tr>'+headers.map(x=>'<th>'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
export const row=(...cells)=>'<tr>'+cells.map(x=>'<td>'+x+'</td>').join('')+'</tr>';
export function ticket(s){let b=s.business;return '<section class="ticket"><h3>'+h(b.name)+'</h3><p>'+h(b.address)+'</p><p>'+h(b.phone)+'</p><hr>'+line('No. struk',nomor(s))+line('Waktu',date(s.at,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+line('Kasir',s.cashier)+'<hr>'+s.items.map(i=>'<div class="ticketitem">'+h(i.name)+line(i.qty+' × '+rp(i.price),rp(i.qty*i.price))+'</div>').join('')+'<hr>'+line('Subtotal',rp(s.subtotal))+line('Diskon',rp(s.discount))+line('TOTAL',rp(s.total))+line(s.method,rp(s.paid))+line('Kembali',rp(s.change))+'<hr><p>'+h(b.footer)+'</p></section>'}
export const search=(id,value,placeholder)=>'<label class="searchbox">'+icon('search',19)+'<input type="search" id="'+id+'" aria-label="'+h(placeholder)+'" placeholder="'+h(placeholder)+'" value="'+h(value)+'"></label>';
export const formEnd=(label='Simpan')=>'<p class="error" role="alert"></p><div class="actions">'+btn('close','Batal')+'<button class="btn primary" type="submit">'+h(label)+'</button></div>';

