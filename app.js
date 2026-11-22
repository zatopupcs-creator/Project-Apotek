.stack{grid-template-columns:minmax(0,1fr)}
.stack>*,.split>*,.panel,.stats>*{min-width:0}
@media(max-width:720px){
 html,body{overflow-x:hidden}
 main{padding-left:16px;padding-right:16px}
 .pagehead{gap:12px;align-items:flex-start;margin-bottom:16px}
 .pagehead>div:first-child{flex:1 1 0;min-width:0}
 .pagehead{flex-wrap:wrap}
 .pagehead>.btn{flex-shrink:0}
 .pagehead>.date{flex:1 0 100%;max-width:none;white-space:nowrap;font-size:.82rem;margin-top:-2px}
 .pagehead h1{font-size:1.75rem}
 .panel{padding:16px;border-radius:16px}
 .panelhead{flex-wrap:wrap;gap:10px;margin-bottom:14px}
 .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .stat{padding:14px;border-radius:14px}
 .stat span{font-size:.78rem}
 .stat b{display:block;font-size:1.1rem;line-height:1.3;overflow-wrap:anywhere}
 .reportfilters{display:block}
 .reportfilters .fieldbox,.reportfilters .selbtn{width:100%;min-width:0}
 .rangebtn{padding-left:12px;padding-right:12px;gap:8px}
 .rangebtn>span{font-size:.78rem;letter-spacing:-.01em}
 .barrow{grid-template-columns:58px minmax(0,1fr) auto;gap:8px;font-size:.8rem}
 .settingsnav{display:grid;grid-template-columns:repeat(3,minmax(0,auto));gap:6px;justify-content:stretch}
 .settingsnav .btn{padding:10px 6px;font-size:.78rem;gap:5px;white-space:nowrap}
 .settingsnav .btn svg{width:15px;height:15px}
 .actions{justify-content:stretch}
 .actions .btn{flex:1 1 auto}
 .toolsrow{gap:8px}
 dialog{width:94vw}
 .modalbody{padding:16px}

 .tablewrap{overflow:visible}
 .tablewrap table{display:block;width:100%;white-space:normal}
 .tablewrap thead{display:none}
 .tablewrap tbody{display:grid;gap:12px}
 .tablewrap tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px;position:relative;padding:14px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 3px #18253908}
 .tablewrap td{display:block;min-width:0;padding:0;border:0;font-size:.9rem;white-space:normal;overflow-wrap:anywhere;text-align:left!important}
 .tablewrap td:first-child{grid-column:1/-1;padding-right:46px;font-weight:650}
 .tablewrap td[data-label]:not([data-label=""]):not(:first-child)::before{content:attr(data-label);display:block;margin-bottom:3px;font-size:.72rem;font-weight:600;color:var(--muted)}
 .tablewrap td[data-label=""]{position:absolute;top:10px;right:10px}
 .tablewrap td[data-label=""] .btn{padding:7px 10px;font-size:.8rem}
 .tablewrap td>.btn[data-a="contact"]{padding:6px 10px;font-size:.84rem;border-radius:8px;justify-content:flex-start;text-align:left}
 .tablewrap .tableproduct{align-items:center}
 .tablewrap .tableproduct b{display:block;line-height:1.3}
 .tablewrap .tableproduct small{margin-top:2px}
}

.photo .fallback,.thumb .fallback{width:100%;height:100%;min-height:44px}
@media(max-width:720px){
 .chips{scrollbar-width:none;margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}
 .chips::-webkit-scrollbar{display:none}
 .toolsrow .btn{flex-shrink:0}
 .cardbottom{margin-top:8px}
 .price{font-size:.98rem}
}
.products .card{display:flex;flex-direction:column}
.products .cardbody{flex:1;display:flex;flex-direction:column}
.products .cardbottom{margin-top:auto;padding-top:10px}

.signin-photo.has-logo{display:grid;place-items:center;background:linear-gradient(145deg,#fff4ea,#f6efe8);padding:32px}
.signin-photo img.signin-logo{position:static;inset:auto;width:auto;height:auto;max-width:72%;max-height:72%;object-fit:contain}
.signin-mark{color:#c8612f;display:grid;place-items:center}
@media(max-width:640px){.signin-photo.has-logo{padding:18px}.signin-photo img.signin-logo{max-height:100px;max-width:60%}}

.signin-card{grid-template-columns:1fr!important;max-width:520px!important;min-height:0!important}
.signin-form{padding:clamp(28px,5vw,44px)!important}
.signin-form h1{text-align:center;font-size:clamp(1.3rem,5.2vw,1.95rem)!important;white-space:nowrap}
.inputicon{position:relative;display:block;font-weight:400}
.inputicon>svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#6b7280;pointer-events:none}
.inputicon .control{padding-left:46px}
.inputicon .pwtoggle{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;display:grid;place-items:center;border:0;background:none;color:#6b7280;border-radius:8px;cursor:pointer}
.inputicon .pwtoggle:hover{color:#202630}
.inputicon:has(.pwtoggle) .control{padding-right:48px}
.pwtoggle .eye-hide{display:none}
.pwtoggle.on .eye-hide{display:grid}
.pwtoggle.on .eye-show{display:none}
.pwtoggle span{display:grid}
.rowactions{display:inline-flex;align-items:center;gap:4px}
.iconbtn[data-a="deleteproduct"]:hover{color:#a63820;background:#fbeeea}
@media(min-width:721px){
 .tablewrap{overflow-x:hidden}
 .tablewrap table{white-space:normal;width:100%}
 .tablewrap td,.tablewrap th{overflow-wrap:anywhere;padding-left:8px;padding-right:8px}
 .tablewrap td .btn{white-space:normal;text-align:left}
 .tablewrap td:has(.rowactions){width:1%;white-space:nowrap}
}
.sk{display:block;background:linear-gradient(90deg,#e8ebf0 25%,#f3f5f8 40%,#e8ebf0 60%);background-size:300% 100%;animation:skshimmer 1.4s ease-in-out infinite;border-radius:8px}
@keyframes skshimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}
.sk-title{width:min(240px,60%);height:34px;margin-bottom:10px}
.sk-sub{width:min(360px,80%);height:14px}
.sk-search{width:100%;height:45px;border-radius:9px}
.sk-chips{display:flex;gap:8px;margin:15px 0 22px}
.sk-chip{width:78px;height:36px}
.sk-photo{width:100%;aspect-ratio:1.81;border-radius:0}
.sk-line{height:13px;margin:10px 0}
.sk-line.w15{width:15%}.sk-line.w20{width:20%}.sk-line.w40{width:40%}.sk-line.w60{width:60%}.sk-line.w80{width:80%}
.sk-cart{padding:19px;display:grid;gap:8px;align-content:start}
.sk-block{height:120px}
.sk-btn{height:46px;margin-top:10px}
.sk-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #eceef1}
.sk-row:last-child{border-bottom:0}
.sk-search+.sk-row{margin-top:18px}
.sk-thumb{width:56px;height:56px;flex-shrink:0}
.sk-grow{flex:1;min-width:0}
.sk-grow .sk-line{margin:6px 0}
@media(prefers-reduced-motion:reduce){.sk{animation:none}}
.btn,.chip,.square,.iconbtn,.snav-item,.snav-logout,.snav-user,.card,.linkbtn{transition:transform .16s ease,box-shadow .22s ease,background-color .2s ease,border-color .2s ease,color .2s ease}
.menu-toggle{transition:left .28s ease,box-shadow .2s ease,transform .16s ease}
@media(hover:hover){
 .btn:hover:not(:disabled),.chip:hover{transform:translateY(-1px);box-shadow:0 5px 14px #18253914}
 .btn.dark:hover:not(:disabled),.primary:hover:not(:disabled){box-shadow:0 8px 20px #20263040}
 .square:hover:not(:disabled){transform:scale(1.1)}
 .iconbtn:hover{background:#f1f3f6;transform:scale(1.1)}
 .card:hover{transform:translateY(-3px);box-shadow:0 12px 26px #39240d16}
 .snav-item:hover{transform:translateX(3px)}
 .menu-toggle:hover{transform:scale(1.06)}
}
.btn:active:not(:disabled),.chip:active,.square:active:not(:disabled),.iconbtn:active,.menu-toggle:active,.snav-item:active,.snav-logout:active{transform:scale(.96)}
.control{transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}
.control:focus{outline:0;border-color:#202630;box-shadow:0 0 0 3px #20263018}
.btn.loading{position:relative;color:transparent!important;pointer-events:none}
.btn.loading svg{opacity:0}
.btn.loading::after{content:'';position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid #ffffff55;border-top-color:#fff;animation:spin .7s linear infinite}
.btn:not(.dark):not(.primary).loading::after{border-color:#20263026;border-top-color:#202630}
@keyframes spin{to{transform:rotate(360deg)}}
.signin-card{animation:rise .5s cubic-bezier(.2,.7,.2,1)}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
dialog[open]{animation:dlgin .24s cubic-bezier(.2,.7,.2,1)}
dialog[open]::backdrop{animation:fadein .24s ease}
@keyframes dlgin{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
#toast{animation:toastin .32s cubic-bezier(.2,.7,.2,1)}
@keyframes toastin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){
 .btn,.chip,.square,.iconbtn,.snav-item,.card{transition:none}
 .btn:hover,.chip:hover,.square:hover,.iconbtn:hover,.card:hover,.snav-item:hover,.menu-toggle:hover{transform:none}
 .signin-card,dialog[open],dialog[open]::backdrop,#toast{animation:none}
}
#toast .okwrap{position:relative;display:grid;place-items:center;width:32px;height:32px;flex-shrink:0}
#toast .okmark{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;animation:okpop .45s .75s ease}
#toast .okc{stroke-dasharray:145;stroke-dashoffset:145;transform:rotate(-90deg);transform-origin:50% 50%;animation:okdraw .5s ease forwards}
#toast .okp{stroke-dasharray:40;stroke-dashoffset:40;animation:okdraw .3s .45s ease forwards}
#toast .okwrap::after{content:'';position:absolute;inset:0;border-radius:50%;border:2px solid #fff;opacity:0;animation:okburst .6s .75s ease-out}
#toast .okwrap::before{content:'';position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px;border-radius:50%;background:#fff;opacity:0;box-shadow:0 -19px #fff,0 19px #fff,19px 0 #fff,-19px 0 #fff,13px 13px #fff,-13px 13px #fff,13px -13px #fff,-13px -13px #fff;animation:oksparkle .65s .75s ease-out}
@keyframes okdraw{to{stroke-dashoffset:0}}
@keyframes okpop{0%{transform:scale(1)}50%{transform:scale(1.22)}100%{transform:scale(1)}}
@keyframes okburst{0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(2.1)}}
@keyframes oksparkle{0%{opacity:1;transform:scale(.3)}70%{opacity:1}100%{opacity:0;transform:scale(1.5)}}
#toast.error{animation:toastin .32s cubic-bezier(.2,.7,.2,1),shake .4s .32s ease}
@keyframes shake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.flydot{position:fixed;z-index:70;width:30px;height:30px;border-radius:50%;background:#202630 center/cover no-repeat;border:2px solid #fff;box-shadow:0 6px 16px #0004;pointer-events:none}
.square.ok{background:#43a64f;border-color:#43a64f;transform:scale(1.12)}
@media(prefers-reduced-motion:reduce){
 #toast .okc,#toast .okp{stroke-dashoffset:0;animation:none}
 #toast .okmark,#toast .okwrap::before,#toast .okwrap::after,#toast.error{animation:none}
}
.boxicon.logo{width:40px;height:40px;background:#fff;border:1px solid var(--line);padding:3px}
.boxicon.logo img{width:100%;height:100%;object-fit:contain;border-radius:6px}
.addcol{display:flex;flex-direction:column;align-items:flex-end;gap:7px}
.addcol .stocktag{position:relative;left:auto;top:auto;background:none;border:0;padding:0;font-size:.76rem;color:#68717e}
.stocknum{display:inline-block;min-width:1ch;font-variant-numeric:tabular-nums}
.stocktag.dec .stocknum{color:#202630;font-weight:800}
.stockminus{position:absolute;right:0;top:-6px;font-weight:800;font-size:.82rem;color:#202630;pointer-events:none;animation:minusfloat 1.2s ease forwards}
@keyframes minusfloat{0%{opacity:0;transform:translateY(4px)}20%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}
@media(prefers-reduced-motion:reduce){.stockminus{animation:none;display:none}}
.donefx{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);animation:fadein .25s ease}
.donefx.out{animation:fadeout .3s ease forwards}
.donebox{display:grid;justify-items:center;gap:10px;text-align:center;padding:24px}
.donering{position:relative;width:160px;height:160px;display:grid;place-items:center;margin-bottom:8px}
.donering svg{width:160px;height:160px;fill:none;stroke:#43a64f;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;animation:okpop .55s 1s ease}
.donering .dc{stroke-dasharray:145;stroke-dashoffset:145;transform:rotate(-90deg);transform-origin:50% 50%;animation:okdraw .7s .15s ease forwards}
.donering .dp{stroke-dasharray:40;stroke-dashoffset:40;animation:okdraw .45s .8s ease forwards}
.donering::after{content:'';position:absolute;inset:0;border-radius:50%;border:3px solid #43a64f;opacity:0;animation:okburst .8s 1s ease-out}
.donering i{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px;border-radius:50%;background:#202630;opacity:0;animation:donefly .85s 1s ease-out forwards}
.donering i:nth-child(even){background:#43a64f;width:7px;height:7px}
.donebox strong{font-size:1.65rem;letter-spacing:-.03em;opacity:0;animation:riseup .45s 1.1s ease forwards}
.donebox span{font-size:1.1rem;color:#68717e;opacity:0;animation:riseup .45s 1.25s ease forwards}
@keyframes donefly{0%{opacity:1;transform:rotate(var(--a)) translateY(-84px) scale(1)}100%{opacity:0;transform:rotate(var(--a)) translateY(-140px) scale(.2)}}
@keyframes riseup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes fadeout{to{opacity:0}}
@media(prefers-reduced-motion:reduce){
 .donefx,.donefx.out{animation:none}
 .donering .dc,.donering .dp{stroke-dashoffset:0;animation:none}
 .donering svg,.donering::after,.donering i{animation:none}
 .donering i{display:none}
 .donebox strong,.donebox span{opacity:1;animation:none}
}
body.no-anim *,body.no-anim *::before,body.no-anim *::after{transition:none!important}
#cataloglist[aria-busy="true"] .card{pointer-events:none}
.sk-brandlogo{width:56px;height:56px;border-radius:14px;flex-shrink:0}
.sk-brandname{width:120px;height:22px}
.sk-navlabel{width:100px;height:12px;margin:8px 0 16px 18px}
.sk-navitem{display:flex;align-items:center;gap:14px;height:70px;padding:0 16px}
.sk-navitem i:first-child{width:22px;height:22px;border-radius:6px;flex-shrink:0}
.sk-navitem i:last-child{width:90px;height:14px}
.sk-user{display:flex;align-items:center;gap:12px;padding:8px}
.sk-avatar{width:66px;height:66px;border-radius:50%;flex-shrink:0}
.sk-user div{display:grid;gap:8px}
.sk-user div i{width:92px;height:14px}
.sk-user div i+i{width:60px;height:12px}
.sk-logout{height:68px;border-radius:16px}
.floatfield{position:relative;display:block}
.floatfield .inputicon{display:block}
.floatfield label{position:absolute;left:46px;top:50%;transform:translateY(-50%);padding:0 6px;margin-left:-6px;color:#6b7280;font-size:1rem;font-weight:400;line-height:1.2;pointer-events:none;background:#fff;transition:top .18s ease,left .18s ease,font-size .18s ease,color .18s ease,font-weight .18s ease}
.floatfield input:focus~label,.floatfield input:not(:placeholder-shown)~label,.floatfield input:-webkit-autofill~label{top:0;left:18px;font-size:.78rem;font-weight:600;color:#202630}
.floatfield .control{background:#fff}
.floatfield .control:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #fff inset;-webkit-text-fill-color:#202630}
.askdlg{width:min(400px,calc(100vw - 32px));padding:30px 26px 24px;text-align:center;border:0;border-radius:22px;box-shadow:0 24px 80px #1a24363d}
.askdlg::backdrop{background:#17212e66;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.askdlg.closing{animation:fadeout .17s ease forwards}
.askicon{display:grid;place-items:center;width:60px;height:60px;margin:0 auto 14px;border-radius:50%;background:#eef0f4;color:#202630}
.askdlg h2{margin:0 0 8px}
.askdlg p{margin:0;color:#68717e;line-height:1.5}
.askdlg .actions{justify-content:center;margin-top:24px}
.askdlg .actions .btn{flex:1;justify-content:center;min-height:46px}
main:has(.login-stage){padding-top:0;padding-bottom:0}
.login-stage{padding:16px 0}
@media(min-width:641px){.login-stage{min-height:calc(100dvh - 70px)}}
.signin-brand{display:block;width:clamp(64px,12vh,96px);height:clamp(64px,12vh,96px);object-fit:contain;margin:0 auto clamp(14px,2.6vh,24px);border-radius:22px}
.signin-form{padding:clamp(26px,5.5vh,56px) clamp(26px,5vw,52px)!important}
.signin-form h1{margin-bottom:clamp(22px,4.6vh,40px)!important}
.signin-form .stack{display:grid;gap:clamp(16px,2.8vh,24px)}
.signin-form .control{min-height:clamp(48px,6.6vh,58px);font-size:1rem}
.login-submit{margin-top:clamp(18px,3.4vh,30px);min-height:clamp(48px,6.6vh,56px);font-size:1rem;letter-spacing:.01em}
#toast .xp1,#toast .xp2{stroke-dasharray:24;stroke-dashoffset:24;animation:okdraw .25s .45s ease forwards}
#toast .xp2{animation-delay:.65s}
#toast .okwrap.err::before{display:none}
@media(prefers-reduced-motion:reduce){#toast .xp1,#toast .xp2{stroke-dashoffset:0;animation:none}}
