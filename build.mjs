import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const core=readFileSync(new URL('./core.mjs',import.meta.url),'utf8');
const exports=[...core.matchAll(/export (?:const|function|class) (\w+)/g)].map(x=>x[1]);
const logic=`const C=(()=>{\n${core.replaceAll('export ','')}\nreturn {${exports.join(',')}};\n})();`;
const app=readFileSync(new URL('./app.mjs',import.meta.url),'utf8').replace(/^import .*?;\n/,'');
const css=readFileSync(new URL('./styles.css',import.meta.url),'utf8');
const html=`<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#113d43"><meta name="description" content="SPIC asmeninės pagalbos administravimo demonstracija: vizitų planavimas, suteiktų paslaugų apskaita, patikra ir dokumentai."><title>SPIC · Asmeninės pagalbos valdymas</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%23113d43'/%3E%3Ctext x='13' y='29' fill='%23b9efd6' font-family='Arial' font-size='30'%3Es%3C/text%3E%3C/svg%3E"><style>${css}</style></head><body><aside id="sidebar"></aside><header id="topbar"></header><main id="main" tabindex="-1"></main><dialog id="modal"></dialog><div id="toast" role="status" aria-live="polite"></div><div id="print-zone"></div><noscript>Šiai demonstracijai reikalingas JavaScript.</noscript><script type="module">(()=>{'use strict';\n${logic}\n${app}\n})();</script></body></html>`;
mkdirSync('dist',{recursive:true});writeFileSync('dist/index.html',html);writeFileSync('index.html',html);copyFileSync('sw.js','dist/sw.js');
console.log(`Built dist/index.html (${Buffer.byteLength(html)} bytes)`);
