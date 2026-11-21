const ApotekNavigation = (() => {
  const {h,icon,btn,ib,logoUrl} = ApotekUI;
  const {menus,config} = ApotekData;
  const pane=document.getElementById('rightnav');
  const desktop=matchMedia('(min-width: 1100px)');
  let activeUser=null,expandedOnDesktop=localStorage.getItem('figiha.sidebar')!=='closed';
  function sync(){
   const docked=Boolean(activeUser&&desktop.matches&&pane.open);
   document.body.classList.toggle('side-docked',docked);
   const button=document.getElementById('menu-toggle');
   if(button){button.setAttribute('aria-expanded',String(pane.open));button.title=pane.open?'Tutup menu':'Buka menu'}
  }
  function openPane(){
   if(!activeUser||pane.open)return;
   if(desktop.matches)pane.show();else pane.showModal();
   sync();
  }
  function closeMenu(remember=true){
   if(desktop.matches&&remember){expandedOnDesktop=false;localStorage.setItem('figiha.sidebar','closed')}
   if(pane.open)pane.close();sync();
  }
  function selectMenu(){if(!desktop.matches)closeMenu(false)}
  function toggleMenu(){
   if(pane.open){closeMenu();return}
   if(desktop.matches){expandedOnDesktop=true;localStorage.setItem('figiha.sidebar','open')}
   openPane();
  }
  pane.addEventListener('cancel',event=>{event.preventDefault();closeMenu()});
  pane.addEventListener('click',event=>{
   if(event.target!==pane||desktop.matches)return;
   const rect=pane.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right)closeMenu(false);
  });
  desktop.addEventListener('change',()=>{closeMenu(false);if(desktop.matches&&expandedOnDesktop)openPane()});
  function renderNavigation(user,page,brand,can){
   const first=!activeUser&&user;activeUser=user;
   const logo=logoUrl(brand.logo)||'icon.svg';
   document.querySelector('link[rel="icon"]').href=logo;
   document.getElementById('header').innerHTML='<div class="headinner revised-head"><button class="brand" data-a="home" type="button"><img alt="" src="'+logo+'"><span>'+h(brand.name||'Apotek Figiha')+'</span></button>'+
    (user?'<button type="button" id="menu-toggle" class="btn menu-toggle" data-a="togglemenu" aria-controls="rightnav" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>Menu</button>':
    '<span class="mode-label">'+icon(config()?'database':'kasir',16)+(config()?'Kasir apotek':'Mode demo')+'</span>')+'</div>';
   if(!user){closeMenu(false);pane.innerHTML='';return}
   const links=Object.entries(menus).filter(([m])=>can(m)).map(([m,label])=>'<button type="button" class="navbtn '+(page===m?'current':'')+'" data-a="nav" data-id="'+m+'" '+(page===m?'aria-current="page"':'')+'>'+icon(m,18)+h(label)+'</button>').join('');
   pane.innerHTML='<div class="drawer-head"><h2 id="nav-title">Menu</h2>'+ib('closemenu','Tutup menu','close')+'</div>'+
    '<nav class="side-links" aria-label="Menu utama">'+links+'</nav><div class="drawer-profile"><span class="avatar">'+h(user.name.trim().slice(0,2).toUpperCase())+'</span><button data-a="account" class="who"><strong>'+h(user.name)+'</strong><small>'+h(user.owner?'Pemilik':user.employee_code||'Pegawai')+'</small></button></div><div class="drawer-foot">'+btn('logout','Keluar akun','user')+'</div>';
   if(first&&desktop.matches&&expandedOnDesktop)openPane();sync();
  }
return { closeMenu, selectMenu, toggleMenu, renderNavigation };
})();
