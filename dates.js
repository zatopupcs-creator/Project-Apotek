const ApotekDates = (() => {
  const pad=n=>String(n).padStart(2,'0');
  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const SHORT=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const PRESETS=[['jam','1 Jam Terakhir'],['hari','Hari Ini'],['kemarin','Kemarin'],['7','7 Hari Terakhir'],['30','30 Hari Terakhir'],['bulan','Bulan Ini'],['lalu','Bulan Lalu'],['semua','Semua Tanggal']];
  const iso=(y,m,d)=>y+'-'+pad(m+1)+'-'+pad(d);
  const parse=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return {y,m:m-1,d}};
  const addDays=(s,n)=>{const {y,m,d}=parse(s),t=new Date(Date.UTC(y,m,d+n));return iso(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate())};
  const monthDays=(y,m)=>new Date(Date.UTC(y,m+1,0)).getUTCDate();
  const wall=ms=>new Date(ms+7*3600000).toISOString().slice(0,16);
  const nowWall=()=>wall(Date.now());
  // Label dari waktu dinding WIB: "2026-11-21" atau "2026-11-21T00:00".
  function label(v){
   if(!v)return '';const {y,m,d}=parse(v);
   return d+' '+SHORT[m]+' '+y+(String(v).length>10?' '+String(v).slice(11,16):'');
  }
  function longDate(v){const {y,m,d}=parse(v);return d+' '+MONTHS[m]+' '+y}
  function presetRange(key){
   const now=nowWall(),today=now.slice(0,10),{y,m}=parse(today);
   switch(key){
    case 'jam':return {from:wall(Date.now()-3600000),to:now};
    case 'hari':return {from:today+'T00:00',to:today+'T23:59'};
    case 'kemarin':{const d=addDays(today,-1);return {from:d+'T00:00',to:d+'T23:59'}}
    case '7':return {from:addDays(today,-6)+'T00:00',to:today+'T23:59'};
    case '30':return {from:addDays(today,-29)+'T00:00',to:today+'T23:59'};
    case 'bulan':return {from:iso(y,m,1)+'T00:00',to:iso(y,m,monthDays(y,m))+'T23:59'};
    case 'lalu':{const t=new Date(Date.UTC(y,m-1,1)),yy=t.getUTCFullYear(),mm=t.getUTCMonth();return {from:iso(yy,mm,1)+'T00:00',to:iso(yy,mm,monthDays(yy,mm))+'T23:59'}}
    default:return {from:null,to:null};
   }
  }
  const ms=(v,end)=>Date.parse(v+(end?':59.999':':00')+'+07:00');
  return {pad,MONTHS,SHORT,PRESETS,iso,parse,addDays,monthDays,wall,nowWall,label,longDate,presetRange,ms};
})();
