const ApotekPickers = (() => {
  const {h,icon} = ApotekUI;
  const D = ApotekDates;
  const dlg = document.getElementById('datepick');

  let menu=null,trigger=null,active=-1,opts=[],openedAt=0,lastWidth=innerWidth;
  function closeMenu(){
   if(!menu)return;
   menu.remove();trigger?.setAttribute('aria-expanded','false');trigger?.classList.remove('open');
   menu=null;trigger=null;active=-1;opts=[];
  }
  function setActive(i,scroll=true){
   if(!menu)return;const items=menu.querySelectorAll('.selopt');if(!items.length)return;
   active=Math.max(0,Math.min(items.length-1,i));
   items.forEach((el,n)=>el.classList.toggle('act',n===active));
   if(scroll){
    const el=items[active],top=el.offsetTop,bottom=top+el.offsetHeight;
    if(top<menu.scrollTop)menu.scrollTop=top-6;else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight+6;
   }
  }
  function openMenu(btn){
   closeMenu();
   const input=btn.parentElement.querySelector('input[type=hidden]');if(!input?.dataset.options)return;
   opts=JSON.parse(input.dataset.options);trigger=btn;openedAt=Date.now();
   menu=document.createElement('div');menu.className='selmenu';menu.setAttribute('role','listbox');
   menu.innerHTML=opts.map(([v,l])=>'<div class="selopt'+(v===input.value?' sel':'')+'" role="option" aria-selected="'+(v===input.value)+'" data-v="'+h(v)+'"><span>'+h(l)+'</span>'+(v===input.value?icon('check',18):'')+'</div>').join('');
   (btn.closest('dialog')||document.body).append(menu);
   const r=btn.getBoundingClientRect(),vw=innerWidth,vh=innerHeight,width=Math.max(r.width,btn.closest('.pgsel')?120:170);
   const below=vh-r.bottom-14,above=r.top-14,natural=Math.min(320,menu.scrollHeight);
   const down=below>=natural||below>=above,room=Math.max(120,down?below:above);
   menu.style.width=width+'px';menu.style.left=Math.max(8,Math.min(r.left,vw-width-8))+'px';
   menu.style.maxHeight=Math.min(320,room)+'px';
   const height=Math.min(menu.scrollHeight,parseFloat(menu.style.maxHeight));
   menu.style.top=(down?r.bottom+6:r.top-6-height)+'px';
   btn.setAttribute('aria-expanded','true');btn.classList.add('open');
   const cur=opts.findIndex(([v])=>v===input.value);setActive(cur<0?0:cur);
   if(cur>0)menu.scrollTop=Math.max(0,menu.querySelectorAll('.selopt')[cur].offsetTop-menu.clientHeight/2+20);
  }
  function choose(v){
   const btn=trigger,input=btn.parentElement.querySelector('input[type=hidden]'),o=opts.find(([x])=>x===v);
   closeMenu();if(!o||input.value===v)return;
   input.value=v;btn.querySelector('span').textContent=o[1];
   input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  document.addEventListener('click',e=>{
   const sel=e.target.closest('.selbtn:not([data-dp])');
   if(sel){if(menu&&trigger===sel)closeMenu();else openMenu(sel);return}
   const opt=e.target.closest('.selopt');if(opt&&menu?.contains(opt)){choose(opt.dataset.v);return}
   if(menu&&!menu.contains(e.target))closeMenu();
  });
  document.addEventListener('mousemove',e=>{
   const opt=e.target.closest?.('.selopt');if(!opt||!menu?.contains(opt))return;
   const i=[...menu.children].indexOf(opt);if(i!==active)setActive(i,false);
  });
  document.addEventListener('keydown',e=>{
   if(!menu){
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&e.target.matches?.('.selbtn:not([data-dp])')){e.preventDefault();openMenu(e.target)}
    return;
   }
   const k=e.key;
   if(k==='Escape'){e.preventDefault();e.stopPropagation();const b=trigger;closeMenu();b?.focus();return}
   if(k==='ArrowDown'){e.preventDefault();setActive(active+1)}
   else if(k==='ArrowUp'){e.preventDefault();setActive(active-1)}
   else if(k==='Home'){e.preventDefault();setActive(0)}
   else if(k==='End'){e.preventDefault();setActive(opts.length-1)}
   else if(k==='Enter'||k===' '){e.preventDefault();if(opts[active])choose(opts[active][0])}
   else if(k==='Tab')closeMenu();
  },true);
  document.addEventListener('scroll',e=>{if(menu&&Date.now()-openedAt>500&&!(e.target instanceof Node&&menu.contains(e.target)))closeMenu()},true);
  addEventListener('resize',()=>{if(innerWidth!==lastWidth){lastWidth=innerWidth;closeMenu()}});

  let st=null;
  const DAYS=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  function openPicker(kind,btn){
   closeMenu();
   if(kind==='range'){
    const mg=ApotekManagement.mg,all=mg.preset==='semua'||!mg.from;
    st={kind,btn,all,preset:mg.preset,from:all?null:mg.from.slice(0,10),to:all?null:mg.to.slice(0,10),ft:all?'00:00':mg.from.slice(11,16),tt:all?'23:59':mg.to.slice(11,16),since:btn.dataset.since||'',picking:false};
   }else{
    const input=btn.parentElement.querySelector('input[type=hidden]');
    st={kind,btn,input,from:input.value||null,to:input.value||null,since:'',picking:false};
   }
   const {y,m}=D.parse(st.from||D.nowWall());st.vy=y;st.vm=m;
   dlg.classList.toggle('single',kind==='single');
   draw();if(!dlg.open)dlg.showModal();
  }
  function summary(){
   if(st.kind==='single')return st.from?D.label(st.from):'Belum ada tanggal dipilih';
   if(st.all||!st.from)return 'Semua tanggal';
   const to=st.to||st.from;return D.label(st.from+'T'+st.ft)+' → '+D.label(to+'T'+st.tt);
  }
  function draw(focus){
   const {vy,vm}=st,lead=(new Date(Date.UTC(vy,vm,1)).getUTCDay()+6)%7,days=D.monthDays(vy,vm),today=D.nowWall().slice(0,10);
   const lo=st.from&&st.to&&st.from>st.to?st.to:st.from,hi=st.from&&st.to&&st.from>st.to?st.from:(st.to||st.from);
   let cells='<span></span>'.repeat(lead);
   for(let d=1;d<=days;d++){
    const iso=D.iso(vy,vm,d),end=iso===lo||iso===hi,mid=lo&&hi&&iso>lo&&iso<hi;
    cells+='<button type="button" class="dp-day'+(end?' sel':'')+(mid?' mid':'')+(iso===today?' today':'')+'" data-date="'+iso+'" aria-pressed="'+(end||mid)+'" aria-label="'+d+' '+D.MONTHS[vm]+' '+vy+'">'+d+'</button>';
   }
   const presets=st.kind==='range'?'<div class="dp-presets" role="group" aria-label="Rentang cepat">'+D.PRESETS.map(([k,l])=>'<button type="button" class="dp-preset'+((st.all?'semua':st.preset)===k?' on':'')+'" data-preset="'+k+'">'+h(l)+'</button>').join('')+'</div>':'';
   const times=st.kind==='range'?'<div class="dp-times"><label>Dari jam<input class="control" type="time" id="dp-ft" value="'+h(st.ft)+'"'+(st.all?' disabled':'')+'></label><label>Sampai jam<input class="control" type="time" id="dp-tt" value="'+h(st.tt)+'"'+(st.all?' disabled':'')+'></label></div>':'';
   const note=st.since?'<p class="dp-note">Data transaksi dihitung mulai '+h(D.longDate(st.since))+'.</p>':'';
   dlg.innerHTML='<div class="dp">'+presets+'<div class="dp-main"><div class="dp-nav"><button type="button" class="dp-arrow" data-nav="-1" aria-label="Bulan sebelumnya">'+icon('down',16).replace('<svg','<svg style="transform:rotate(90deg)"')+'</button><h2 id="dp-title">'+D.MONTHS[vm]+' '+vy+'</h2><button type="button" class="dp-arrow" data-nav="1" aria-label="Bulan berikutnya">'+icon('down',16).replace('<svg','<svg style="transform:rotate(-90deg)"')+'</button></div>'+
    '<div class="dp-week">'+DAYS.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="dp-grid">'+cells+'</div>'+times+
    '<div class="dp-summary" id="dp-summary">'+h(summary())+'</div>'+note+
    '<div class="dp-actions"><button type="button" class="btn dp-reset" data-act="reset">'+(st.kind==='range'?'Reset':'Hapus')+'</button><button type="button" class="btn dp-apply" data-act="apply">Terapkan</button></div></div></div>';
   dlg.setAttribute('aria-labelledby','dp-title');
   if(focus)dlg.querySelector(focus)?.focus();
  }
  function applyRange(){
   if(st.all){document.dispatchEvent(new CustomEvent('dp-range',{detail:{preset:'semua',from:null,to:null}}));return}
   let a=st.from+'T'+st.ft,b=(st.to||st.from)+'T'+st.tt;if(a>b)[a,b]=[b,a];
   document.dispatchEvent(new CustomEvent('dp-range',{detail:{preset:st.preset||'custom',from:a,to:b}}));
  }
  function apply(){
   if(st.kind==='range'){
    if(!st.all&&!st.from){const f=dlg.querySelector('#dp-summary');f.textContent='Pilih tanggal terlebih dahulu.';return}
    applyRange();
   }else{
    st.input.value=st.from||'';const span=st.btn.querySelector('span');span.textContent=st.from?D.label(st.from):'Pilih tanggal';span.classList.toggle('ph',!st.from);
    st.input.dispatchEvent(new Event('input',{bubbles:true}));st.input.dispatchEvent(new Event('change',{bubbles:true}));
   }
   dlg.close();
  }
  dlg.addEventListener('click',e=>{
   if(e.target===dlg){dlg.close();return}
   const day=e.target.closest('[data-date]'),pre=e.target.closest('[data-preset]'),nav=e.target.closest('[data-nav]'),act=e.target.closest('[data-act]');
   if(day){
    const v=day.dataset.date;st.all=false;st.preset='custom';
    if(st.kind==='single'||!st.picking||!st.from){st.from=v;st.to=v;st.picking=st.kind==='range'}
    else{st.to=v;if(st.to<st.from)[st.from,st.to]=[st.to,st.from];st.picking=false}
    draw('[data-date="'+v+'"]');return;
   }
   if(pre){
    const k=pre.dataset.preset,r=D.presetRange(k);st.picking=false;st.preset=k;
    if(k==='semua'){st.all=true;st.from=st.to=null}
    else{st.all=false;st.from=r.from.slice(0,10);st.to=r.to.slice(0,10);st.ft=r.from.slice(11,16);st.tt=r.to.slice(11,16);const {y,m}=D.parse(st.from);st.vy=y;st.vm=m}
    draw('[data-preset="'+k+'"]');return;
   }
   if(nav){const t=new Date(Date.UTC(st.vy,st.vm+Number(nav.dataset.nav),1));st.vy=t.getUTCFullYear();st.vm=t.getUTCMonth();draw('[data-nav="'+nav.dataset.nav+'"]');return}
   if(act?.dataset.act==='apply')apply();
   if(act?.dataset.act==='reset'){
    if(st.kind==='range'){const r=D.presetRange('bulan');document.dispatchEvent(new CustomEvent('dp-range',{detail:{preset:'bulan',...r}}));dlg.close()}
    else{st.from=st.to=null;apply()}
   }
  });
  dlg.addEventListener('input',e=>{
   if(!st||st.kind!=='range')return;
   if(e.target.id==='dp-ft'&&e.target.value)st.ft=e.target.value;
   if(e.target.id==='dp-tt'&&e.target.value)st.tt=e.target.value;
   if(e.target.id==='dp-ft'||e.target.id==='dp-tt'){st.preset='custom';dlg.querySelector('#dp-summary').textContent=summary();dlg.querySelectorAll('.dp-preset.on').forEach(x=>x.classList.remove('on'))}
  });
  dlg.addEventListener('close',()=>{dlg.replaceChildren();st=null});
  document.addEventListener('click',e=>{const t=e.target.closest('[data-dp]');if(t&&!t.disabled)openPicker(t.dataset.dp,t)});
return { openPicker };
})();
