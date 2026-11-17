import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { PerfMonitor } from '@/components/PerfMonitor';
import { BootMark } from '@/components/BootMark';

export const metadata: Metadata = {
  title: 'Bingo Show TV',
  description: 'Bingo Show TV',
  manifest: '/manifest.webmanifest',
};

// App de TV: sem pinch-zoom, sem escala inicial diferente de 1 — o
// dimensionamento real é feito pelo TvViewport/TvStage via JS, não pelo
// navegador.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#060A14',
};

import { Anton, Barlow_Condensed, Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TvConfigProvider } from '@/contexts/TvConfigContext';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

// Anton: fonte grossa/sólida da home do tema Bingo Show (Ouro & Espaço).
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

// App Android da TV (WebView): liga o modo leve antes do primeiro desenho.
// `?lite=1` e `?lite=0` forçam o modo para teste.
// Ultra leve (`tv_perf=ultra` no localStorage, gravado pelo PerfMonitor ou por
// `?ultra=1`; `?ultra=0` fixa sem ultra; `?perf=reset` volta ao automático).
// TV (modo leve): os eventos de animação/transição param no `window` e não chegam
// ao React. O React escuta todos eles na raiz e trata cada um (procura o
// componente, monta o evento sintético) — no ultra cada animação dura 1ms, então
// abrir um popup disparava ~300 desses eventos de uma vez (≈0,5s de processador
// na TV) e cada bola dezenas. Nenhum componente usa onAnimation*/onTransition*
// nem addEventListener desses eventos; na TV eles não passam do window — para
// reagir ao fim de uma animação, use um timer.
const TV_LITE_SCRIPT = `(function(){try{var q=location.search,u=navigator.userAgent,d=document.documentElement,p=null;try{var m=q.match(/[?&]ultra=([01])/);if(m)localStorage.setItem('tv_perf',m[1]==='1'?'ultra':'normal');if(/[?&]perf=reset/.test(q))localStorage.removeItem('tv_perf');p=localStorage.getItem('tv_perf')}catch(e){}if(/[?&]lite=1/.test(q)||(/Android/.test(u)&&/; wv\\)/.test(u)&&!/[?&]lite=0/.test(q))||p==='ultra')d.classList.add('tv-lite');if(p==='ultra')d.classList.add('tv-ultra');try{var a=q.match(/[?&]anim=([01])/);if(a)localStorage.setItem('tv_anim',a[1]);if(localStorage.getItem('tv_anim')==='0')d.classList.add('tv-noanim')}catch(e){}if(d.classList.contains('tv-lite')){var st=function(e){e.stopPropagation()},ev=['animationstart','animationend','animationiteration','animationcancel','transitionrun','transitionstart','transitionend','transitioncancel'];for(var i=0;i<ev.length;i++)window.addEventListener(ev[i],st,true)}if(d.classList.contains('tv-lite')&&!/[?&]logs=1/.test(q)){var n=function(){};console.log=n;console.info=n;console.debug=n}}catch(e){}})()`;

// Diagnóstico para TV sem adb: JS em ES5 puro, roda antes dos chunks do Next.
// Guarda os erros de JS; se o React não subir em 20s (BootMark não marcou),
// mostra na tela a versão do Chrome/WebView + o erro e manda para /api/perf
// (linha [TV-PERF] {"type":"boot-fail",...} no `vercel logs`).
const TV_BOOT_GUARD = String.raw`(function(){try{var errs=[],w=window,d=document;w.__tvBootErrs=errs;function add(m){if(errs.length<8)errs.push(String(m).slice(0,300))}w.addEventListener('error',function(e){add((e.message||'erro')+(e.filename?' @'+e.filename.split('/').pop()+':'+e.lineno+':'+e.colno:''))},true);w.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;add('promise: '+(r&&r.message||r))});setTimeout(function(){if(d.documentElement.getAttribute('data-tv-booted'))return;var ua=navigator.userAgent,m=ua.match(/Chrome\/(\d+)/),cv=m?m[1]:'?';try{var x=new XMLHttpRequest();x.open('POST','/api/perf',true);x.send(JSON.stringify({type:'boot-fail',chrome:cv,ua:ua,url:location.href,errs:errs}))}catch(e){}var b=d.createElement('div');b.id='tv-boot-fail';b.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:24px 40px;background:#3a0d0d;color:#fff;font:20px/1.4 sans-serif';var old=cv!=='?'&&+cv<64;b.innerHTML='<b>Não foi possível abrir o Bingo Show nesta TV.</b><br>Navegador interno (WebView): Chrome '+cv+(old?' — desatualizado. Atualize o “Android System WebView” da TV.':'')+'<br><small style="opacity:.75">'+errs.map(function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}).join('<br>')+'</small>';(d.body||d.documentElement).appendChild(b)},20000)}catch(e){}})()`;

// WebView antiga (Chrome 64–70, ex.: Android 9 hi352t com Chrome 66): ela entende
// <script type=module>, então PULA o polyfills-*.js do Next (marcado `nomodule`),
// e o código quebra em `globalThis is not defined`. Aqui, só nessas TVs, o mesmo
// arquivo é baixado de forma síncrona e executado (sem inserir <script> no
// <body>, o que atrapalharia a hidratação do React). Roda antes do código do Next porque o
// runtime do webpack (que dispara os módulos) fica no fim do <body>, depois deste
// script. Object.fromEntries (Chrome 73) não vem no pacote do Next.
const TV_LEGACY_POLYFILL = String.raw`(function(){try{var w=window,d=document;if(typeof globalThis==='undefined'){w.globalThis=w;var p=d.querySelector('script[nomodule]');if(p&&p.src){var x=new XMLHttpRequest();x.open('GET',p.src,false);x.send();if(x.status===200)(0,eval)(x.responseText)}}if(!Object.fromEntries)Object.fromEntries=function(it){var o={};Array.from(it).forEach(function(e){o[e[0]]=e[1]});return o}}catch(e){}})()`;

// WebView sem `gap` em flexbox (Chrome < 84, ex.: hi352t com Chrome 66): sem ele os
// itens das linhas e colunas ficam grudados. Marca o <html> com `no-flexgap` (o CSS
// gerado por scripts/postcss-legacy-tv.js troca o gap por margem entre os filhos) e
// faz o mesmo nos estilos inline do React (`style={{ gap }}`), que o CSS não alcança.
// Em TV com Chrome novo o teste passa e nada mais roda.
const TV_FLEXGAP_SCRIPT = String.raw`(function(){try{var d=document,h=d.documentElement,b=d.body||h,f=d.createElement('div');f.style.cssText='display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';f.appendChild(d.createElement('div'));f.appendChild(d.createElement('div'));b.appendChild(f);var ok=f.scrollHeight===1;b.removeChild(f);if(ok)return;h.classList.add('no-flexgap');var pend=0;function px(v){return v&&v!=='normal'&&v!=='0px'&&v!=='0'?v:''}function fix(){pend=0;var els=d.querySelectorAll('[style*="gap"]');for(var i=0;i<els.length;i++){var el=els[i],s=el.style,disp=s.display;if(!disp)disp=getComputedStyle(el).display;if(disp.indexOf('flex')<0)continue;var dir=s.flexDirection||(s.flexFlow||'');if(!dir)dir=getComputedStyle(el).flexDirection;var col=dir.indexOf('column')===0,rev=dir.indexOf('reverse')>0;var parts=(s.gap||'').split(' ');var g=col?px(s.rowGap||parts[0]):px(s.columnGap||parts[1]||parts[0]);var prop=col?(rev?'marginBottom':'marginTop'):(rev?'marginRight':'marginLeft');var first=true;for(var c=el.firstElementChild;c;c=c.nextElementSibling){var cs=c.style;if(c.__fgAbs===undefined){var pos=cs.position||getComputedStyle(c).position;c.__fgAbs=pos==='absolute'||pos==='fixed'}if(c.__fgAbs||cs.display==='none'){continue}var want=first?'':g;first=false;if(c.__fg===want+prop)continue;if(c.__fgp&&c.__fgp!==prop)cs[c.__fgp]='';cs[prop]=want;c.__fg=want+prop;c.__fgp=prop}}}function later(){if(!pend)pend=requestAnimationFrame(fix)}new MutationObserver(later).observe(h,{childList:true,subtree:true});later()}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${barlowCondensed.variable} ${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: TV_LEGACY_POLYFILL }} />
        <script dangerouslySetInnerHTML={{ __html: TV_BOOT_GUARD }} />
        <script dangerouslySetInnerHTML={{ __html: TV_LITE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: TV_FLEXGAP_SCRIPT }} />
        <ThemeProvider>
          <TvConfigProvider>
            <BootMark />
            <PwaRegister />
            <PerfMonitor />
            {children}
          </TvConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

