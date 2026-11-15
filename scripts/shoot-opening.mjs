import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for (const [w,h] of [[1280,720],[390,844]]) {
 const p=await b.newPage({viewport:{width:w,height:h}});
 await p.goto(process.argv[2]);
 for(let i=0;i<120;i++){ if(await p.evaluate(()=>window.__app?.store?.getState().screen).catch(()=>null)==='OPENING')break; await p.waitForTimeout(500);}
 await p.waitForTimeout(3000);
 await p.screenshot({path:`tmp/shots/opening-labels-${w}.png`});
 console.log(w, await p.evaluate(()=>[...document.querySelectorAll('[data-body]')].map(b=>{const r=b.getBoundingClientRect();return b.dataset.body+':'+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)})));
}
await b.close();
