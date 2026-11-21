const ApotekPdf = (() => {
  // Lebar huruf Helvetica (per 1000) untuk ASCII 32–126.
  const W=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const clean=s=>String(s??'').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/→/g,'->').replace(/×/g,'x').replace(/[^\x20-\x7E\u00A0-\u00FF]/g,'?');
  const width=(s,size,bold)=>{let w=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);w+=c>=32&&c<=126?W[c-32]:556}return w*size/1000*(bold?1.06:1)};
  const esc=s=>s.replace(/[\\()]/g,'\\$&');
  function fit(s,max,size,bold){s=clean(s);if(width(s,size,bold)<=max)return s;while(s.length>1&&width(s+'...',size,bold)>max)s=s.slice(0,-1);return s+'...'}
  const f=n=>n.toFixed(2);

  function report(m){
   const PW=595.28,PH=841.89,M=40,CW=PW-M*2,pages=[];let cur,y;
   const newPage=()=>{cur=[];pages.push(cur);y=PH-M};
   const text=(s,x,yy,size=9,bold=false,align='left',gray=.1)=>{
    s=clean(s);const w=width(s,size,bold),xx=align==='right'?x-w:align==='center'?x-w/2:x;
    cur.push(gray+' g BT /'+(bold?'F2':'F1')+' '+size+' Tf '+f(xx)+' '+f(yy)+' Td ('+esc(s)+') Tj ET');
   };
   const rule=(yy,gray=.85)=>cur.push(gray+' G 0.6 w '+f(M)+' '+f(yy)+' m '+f(PW-M)+' '+f(yy)+' l S');
   const box=(x,yy,w,h,gray)=>cur.push(gray+' g '+f(x)+' '+f(yy)+' '+f(w)+' '+f(h)+' re f');
   const room=h=>{if(y-h<M+24){newPage();return true}return false};
   function table(cols,rows,size=8.5){
    const rh=17,head=()=>{box(M,y-rh+4,CW,rh,.94);let x=M;for(const c of cols){text(c.h,c.align==='right'?x+c.w-6:x+6,y-rh+9,size,true,c.align);x+=c.w}y-=rh};
    room(rh*3);head();
    rows.forEach((r,i)=>{
     if(room(rh)){head()}
     if(i%2)box(M,y-rh+4,CW,rh,.975);
     let x=M;cols.forEach((c,j)=>{const s=fit(r[j],c.w-12,size,false);text(s,c.align==='right'?x+c.w-6:x+6,y-rh+9,size,false,c.align);x+=c.w});
     y-=rh;
    });
    if(!rows.length){text('Tidak ada data pada periode ini.',M+6,y-rh+9,size,false,'left',.45);y-=rh}
    y-=6;
   };
   const section=t=>{room(60);y-=10;text(t,M,y-10,11.5,true);y-=20;rule(y+4)};

   newPage();
   text('Laporan Penjualan',M,y-18,19,true);y-=24;
   text(m.brand,M,y-12,11,true,'left',.35);y-=16;
   text('Periode: '+m.period,M,y-12,9,false,'left',.35);y-=13;
   text('Dicetak: '+m.printed,M,y-12,9,false,'left',.35);y-=20;
   // Ringkasan
   const cw=CW/4;
   m.stats.forEach(([l,v],i)=>{
    const col=i%4,row=Math.floor(i/4),x=M+col*cw,top=y-row*46;
    box(x+(col?4:0),top-40,cw-(col<3?4:0)-(col?0:0),40,.955);
    text(l,x+10,top-15,8,false,'left',.4);text(v,x+10,top-31,12,true);
   });
   y-=Math.ceil(m.stats.length/4)*46+4;
   section('Metode pembayaran');
   table([{h:'Metode',w:CW*.6},{h:'Penjualan',w:CW*.4,align:'right'}],m.methods);
   section('Produk terlaris');
   table([{h:'Produk',w:CW*.25},{h:'Terjual',w:CW*.09,align:'right'},{h:'Sebelum diskon',w:CW*.17,align:'right'},{h:'Harga awal',w:CW*.16,align:'right'},{h:'Harga akhir',w:CW*.17,align:'right'},{h:'Untung',w:CW*.16,align:'right'}],m.top);
   section('Rincian transaksi ('+m.rows.length+')');
   table([{h:'No. struk',w:62},{h:'Waktu',w:104},{h:'Kasir',w:98},{h:'Metode',w:58},{h:'Item',w:34,align:'right'},{h:'Total',w:80,align:'right'},{h:'Laba kotor',w:79,align:'right'}],m.rows);

   const n=pages.length;
   pages.forEach((p,i)=>{cur=p;text(clean(m.brand)+' - Laporan Penjualan',M,24,8,false,'left',.5);text('Halaman '+(i+1)+' dari '+n,PW-M,24,8,false,'right',.5)});
   const objs=[];
   objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
   objs[2]='<< /Type /Pages /Kids ['+pages.map((_,i)=>(5+i*2)+' 0 R').join(' ')+'] /Count '+n+' >>';
   objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
   objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
   pages.forEach((p,i)=>{
    const stream=p.join('\n');
    objs[5+i*2]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+PW+' '+PH+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+(6+i*2)+' 0 R >>';
    objs[6+i*2]='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
   });
   let out='%PDF-1.4\n';const offsets=[];
   for(let i=1;i<objs.length;i++){offsets[i]=out.length;out+=i+' 0 obj\n'+objs[i]+'\nendobj\n'}
   const xref=out.length;
   out+='xref\n0 '+objs.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
   return new Blob([Uint8Array.from(out,c=>c.charCodeAt(0)&255)],{type:'application/pdf'});
  }
return { report };
})();
