const ApotekNavigation = (() => {
  const {h,icon,btn,logoUrl} = ApotekUI;
  const {menus,config} = ApotekData;
  const pane=document.getElementById('rightnav');
  const toggle=document.getElementById('menu-toggle');
  const backdrop=document.getElementById('side-backdrop');
  const desktop=matchMedia('(min-width: 1000px)');
  const body=document.body;
  let activeUser=null,isOpen=false,groupCollapsed=false,booting=false,navScroll=0;
  const preferOpen=()=>localStorage.getItem('figiha.sidebar')!=='closed';
  pane.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('snav-scroll'))navScroll=e.target.scrollTop},true);
  function sync(){
   const present=Boolean(activeUser||booting),show=Boolean(present&&isOpen),rail=Boolean(present&&!show&&desktop.matches);
   body.classList.toggle('has-side',present);
   body.classList.toggle('side-open',show);
   body.classList.toggle('side-rail',rail);
   body.classList.toggle('side-modal',show&&!desktop.matches);
   pane.setAttribute('aria-hidden',String(!show&&!rail));
   if('inert' in pane)pane.inert=!show&&!rail;
   pane.querySelectorAll('.snav-item,.snav-user,.snav-logout').forEach(el=>{
    const label=(el.querySelector('strong')||el).textContent.trim();
    if(rail){el.title=label;el.setAttribute('aria-label',label)}
    else{el.removeAttribute('title');el.removeAttribute('aria-label')}
   });
   toggle.hidden=!present;
   toggle.setAttribute('aria-expanded',String(show));
   toggle.title=show?'Tutup menu':'Buka menu';
   toggle.setAttribute('aria-label',toggle.title);
  }
  function openPane(){if(!activeUser)return;isOpen=true;sync()}
  function closeMenu(remember=true){
   if(desktop.matches&&remember&&activeUser)localStorage.setItem('figiha.sidebar','closed');
   isOpen=false;sync();
  }
  function selectMenu(){if(!desktop.matches)closeMenu(false)}
  function toggleMenu(){
   if(isOpen){closeMenu();return}
   if(desktop.matches)localStorage.setItem('figiha.sidebar','open');
   openPane();
  }
  backdrop.addEventListener('click',()=>closeMenu(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&body.classList.contains('side-modal'))closeMenu(false)});
  desktop.addEventListener('change',()=>{isOpen=Boolean(activeUser)&&desktop.matches&&preferOpen();sync()});
  function preload(){
   booting=true;isOpen=desktop.matches&&preferOpen();
   body.classList.add('no-anim');
   pane.innerHTML='';
   sync();
   requestAnimationFrame(()=>requestAnimationFrame(()=>body.classList.remove('no-anim')));
  }
  function renderNavigation(user,page,brand,can){
   booting=false;
   const first=!activeUser&&user;activeUser=user;
   const logo=logoUrl(brand.logo)||'icon.svg';
   const name=brand.name||'Bee Farma';
   document.querySelector('link[rel="icon"]').href=logo;
   document.getElementById('header').innerHTML=user?'':'<div class="headinner revised-head"><span class="brand"><img alt="" src="'+logo+'"><span>'+h(name)+'</span></span></div>';
   if(!user){isOpen=false;pane.innerHTML='';sync();return}
   const sections=[['Utama',['kasir']],['Operasional',['suplier','stok']],['Laporan',['laporan','riwayat']],['Pengelolaan',['pegawai','pengaturan']]];
   const item=m=>'<button type="button" class="snav-item '+(page===m?'current':'')+'" data-a="nav" data-id="'+m+'" '+(page===m?'aria-current="page"':'')+'>'+icon(m,20)+'<span>'+h(menus[m])+'</span>'+(m==='kasir'?'':'<i class="snav-chev">'+icon('right',16)+'</i>')+'</button>';
   const groups=sections.map(([title,keys])=>{
    const shown=keys.filter(m=>Object.hasOwn(menus,m)&&can(m));
    return shown.length?'<div class="snav-group"><div class="snav-label">'+h(title.toUpperCase())+'</div><div class="snav-items">'+shown.map(item).join('')+'</div></div>':'';
   }).join('');
   pane.innerHTML='<div class="snav-brand"><img alt="" src="'+logo+'"><span>'+h(name)+'</span></div>'+
    '<nav class="snav-scroll" aria-label="Menu utama">'+groups+'</nav>'+
    '<div class="snav-foot"><button type="button" data-a="account" class="snav-user"><span class="avatar">'+h(user.name.trim().slice(0,2).toUpperCase())+'</span><span class="who"><strong>'+h(user.name)+'</strong><small>'+h(user.owner?'Pemilik':user.employee_code||'Pegawai')+'</small></span></button>'+
    btn('logout','Keluar','logout','snav-logout')+'</div>';
   const scroller=pane.querySelector('.snav-scroll');
   if(scroller){
    scroller.scrollTop=navScroll;
    const cur=scroller.querySelector('.current'),r=scroller.getBoundingClientRect();
    if(cur&&r.height){
     const c=cur.getBoundingClientRect();
     if(c.bottom>r.bottom)scroller.scrollTop+=c.bottom-r.bottom+12;
     else if(c.top<r.top)scroller.scrollTop-=r.top-c.top+12;
     navScroll=scroller.scrollTop;
    }
   }
   if(first)isOpen=desktop.matches&&preferOpen();
   sync();
   const again=pane.querySelector('.snav-scroll'),cur2=again&&again.querySelector('.current');
   if(again&&cur2){
    const r2=again.getBoundingClientRect(),c2=cur2.getBoundingClientRect();
    if(r2.height){
     if(c2.bottom>r2.bottom)again.scrollTop+=c2.bottom-r2.bottom+12;
     else if(c2.top<r2.top)again.scrollTop-=r2.top-c2.top+12;
     navScroll=again.scrollTop;
    }
   }
  }
return { closeMenu, selectMenu, toggleMenu, renderNavigation, preload };
})();
