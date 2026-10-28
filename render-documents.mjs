// Spausdinamų formų QA naudoja tą pačią formavimo funkciją kaip demonstracija.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import * as C from '../core.mjs';
const source=readFileSync('app.mjs','utf8');
const snippet=source.slice(source.indexOf('function printSignature('),source.indexOf('function printDocument('));
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=iso=>iso?new Date(iso).toLocaleString('lt-LT',{dateStyle:'short',timeStyle:'short'}):'–';
const htmlFor=new Function('e','money','fh','dt',snippet+'\nreturn documentHTML;')(escape,C.fmtMoney,C.fmtHours,dt);
const app=new C.Store(C.seedState(new Date('2026-10-28T15:00:00Z')),{actor:{role:'coordinator',assistantId:'a1'},now:()=>new Date('2026-10-28T15:00:00Z')});
const input={client:'c1',from:'2026-10-01',to:'2026-10-31',source:'approved',issuedDate:'2026-10-28',provider:'Agnė Janušienė',finance:{from:'2026-01',rule:'comp20',rate:12.13,comp:547.5,contribution:109.5}};
const css=readFileSync('styles.css','utf8');
mkdirSync('tmp/pdfs',{recursive:true});
function write(name,type,doc){writeFileSync('tmp/pdfs/'+name+'.html','<!doctype html><html lang="lt"><head><meta charset="utf-8"><style>'+css+'</style></head><body><div id="print-zone">'+htmlFor(type,doc)+'</div></body></html>');}
for(const type of ['payments','serviceActs']){
 const id=app.createDocument(type,input);app.approveDocument(type,id,true);const doc=app.documentForPrint(type,id);write(type,type,doc);
 if(type==='serviceActs'){doc.rows=[...doc.rows,...doc.rows.map((r,i)=>({...r,id:'more-'+i,date:'2026-10-'+String(i+1).padStart(2,'0')})),...doc.rows.map((r,i)=>({...r,id:'more2-'+i,date:'2026-10-'+String(i+1).padStart(2,'0')}))];doc.minutes=doc.rows.reduce((n,r)=>n+r.minutes,0);write('serviceActs-long',type,doc);}
}
