const ApotekIcons = (() => {
  const paths={
  kasir:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M6 11 8 4h8l2 7M7 15h3m5 2h3"/>',
  stok:'<path d="m3 7 9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5m-9 5v10M7 5l9 5"/>',
  suplier:'<path d="M3 5h12v12H3zM15 9h4l3 4v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  laporan:'<path d="M4 3v17h17M8 15v-4m5 4V6m5 9v-6"/>',
  riwayat:'<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6m3-4v6l4 2"/>',
  pegawai:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>',
  pengaturan:'<path d="m9.5 3-.7 2.2-2 .9-2.2-.5-2 3.4 1.5 1.7v2.5l-1.5 1.7 2 3.4 2.2-.5 2 .9.7 2.3h4l.7-2.3 2-.9 2.2.5 2-3.4-1.5-1.7v-2.5l1.5-1.7-2-3.4-2.2.5-2-.9L13.5 3z"/><circle cx="11.5" cy="12" r="3"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 4.6 4.6"/>',
  filter:'<path d="M3 7h9m4 0h5M3 17h3m4 0h11"/><circle cx="14" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  bag:'<path d="M5 8h14l1 13H4zM9 9V6a3 3 0 0 1 6 0v3"/>',
  cart:'<path d="M2 4h3l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
  down:'<path d="m6 9 6 6 6-6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8h16M21 11h-6v5h6"/><circle cx="17" cy="13.5" r=".6"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  pill:'<path d="M4.5 19.5a5.5 5.5 0 0 1 0-7.8l7.2-7.2a5.5 5.5 0 0 1 7.8 7.8l-7.2 7.2a5.5 5.5 0 0 1-7.8 0ZM8 8l8 8"/>',
  receipt:'<path d="M5 3l2 1.5L9.5 3 12 4.5 14.5 3 17 4.5 19 3v18l-3-1.6-2 1.6-2-1.6L9.5 21 7 19.4 5 21zM8.5 9h7M8.5 13h5"/>',
  phone:'<path d="m6 3 3 4-2 3a14 14 0 0 0 7 7l3-2 4 3c-1 8-13 1-16-5-3-5-4-9 1-10z"/>',
  edit:'<path d="m4 16 12-12 4 4L8 20l-5 1zM13 7l4 4"/>',
  print:'<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7zM17 11h1"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  check:'<path d="m4 12 5 5 11-11"/>',database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  barcode:'<path d="M3 5v14m3-14v14m4-14v14m3-14v14m3-14v14m4-14v14"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  chat:'<path d="M21 11.7a9 9 0 0 1-13 8L3 21l1.3-5A9 9 0 1 1 21 11.7z"/>',
  leaf:'<path d="M20 3C12 4 4 6 5 14c1 5 9 7 12 1 2-4 2-7 3-12ZM4 21l10-11"/>',
  kit:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3m-4 4v6m-3-3h6"/>',
  box:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 5V3h8v2m-7 8h6"/>'
  };
  const icon=(name,size=18)=>'<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.box)+'</svg>';
return { icon };
})();
