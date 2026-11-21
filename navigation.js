const ApotekNavigation = (() => {
  const {h,icon,btn,logoUrl} = ApotekUI;
  const {menus,config} = ApotekData;
  const pane=document.getElementById('rightnav');
  const toggle=document.getElementById('menu-toggle');
  const backdrop=document.getElementById('side-backdrop');
  const desktop=matchMedia('(min-width: 1000px)');
  const body=document.body;
  let activeUser=null,isOpen=false,groupCollapsed=false;
  const preferOpen=()=>localStorage.getItem('figiha.sidebar')!=='closed';
  function sync(){
   const show=Boolean(activeUser&&isOpen);
   body.classList.toggle('has-side',Boolean(activeUser));
   body.classList.toggle('side-open',show);
   body.classList.toggle('side-modal',show&&!desktop.matches);
   pane.setAttribute('aria-hidden',String(!show));
   if('inert' in pane)pane.inert=!show;
   toggle.hidden=!activeUser;
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
  function renderNavigation(user,page,brand,can){
   const first=!activeUser&&user;activeUser=user;
   const logo=logoUrl(brand.logo)||'icon.svg';
   const name=brand.name||'Bee Farma';
   document.querySelector('link[rel="icon"]').href=logo;
   // Header hanya dipakai pada layar masuk; setelah masuk navigasi ada di sidebar.
   document.getElementById('header').innerHTML=user?'':'<div class="headinner revised-head"><span class="brand"><img alt="" src="'+logo+'"><span>'+h(name)+'</span></span></div>';
   if(!user){isOpen=false;pane.innerHTML='';sync();return}
   const links=Object.entries(menus).filter(([m])=>can(m)).map(([m,label])=>'<button type="button" class="snav-item '+(page===m?'current':'')+'" data-a="nav" data-id="'+m+'" '+(page===m?'aria-current="page"':'')+'>'+icon(m,20)+'<span>'+h(label)+'</span></button>').join('');
   pane.innerHTML='<div class="snav-brand"><img alt="" src="'+logo+'"><span>'+h(name)+'</span></div>'+
    '<nav class="snav-scroll" aria-label="Menu utama"><div class="snav-group'+(groupCollapsed?' collapsed':'')+'"><button type="button" class="snav-label" data-a="togglegroup" aria-expanded="'+(!groupCollapsed)+'"><span>MENU UTAMA</span>'+icon('down',16)+'</button><div class="snav-items">'+links+'</div></div></nav>'+
    '<div class="snav-foot"><button type="button" data-a="account" class="snav-user"><span class="avatar">'+h(user.name.trim().slice(0,2).toUpperCase())+'</span><span class="who"><strong>'+h(user.name)+'</strong><small>'+h(user.owner?'Pemilik':user.employee_code||'Pegawai')+'</small></span></button>'+
    btn('logout','Keluar','user','snav-logout')+'</div>';
   if(first)isOpen=desktop.matches&&preferOpen();
   sync();
  }
return { closeMenu, selectMenu, toggleMenu, renderNavigation };
})();
