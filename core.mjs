// SPIC demonstracijos verslo taisyklės. Produkcinei sistemai reikalingas serveris.
export const VERSION = 13;
export const STORAGE_KEY = 'spic-v13';
export const clone = x => JSON.parse(JSON.stringify(x));
export const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
export function localDay(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export const monthOf = date => date.slice(0,7);
export function monthBounds(month) { const [y,m]=month.split('-').map(Number); return [month+'-01',localDay(new Date(y,m,0))]; }
export const validDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && localDay(new Date(s+'T12:00:00')) === s;
export function assert(ok, message) { if(!ok) throw new Error(message); }
export function integerMinutes(v) { return v.endISO ? Math.max(0,Math.round((Date.parse(v.endISO)-Date.parse(v.startISO))/60000)) : 0; }
export const hours = minutes => minutes / 60;
export const sumMinutes = rows => rows.reduce((n,v)=>n+integerMinutes(v),0);
export const fmtHours = minutes => (minutes/60).toLocaleString('lt-LT',{minimumFractionDigits:2,maximumFractionDigits:2});
export const fmtMoney = cents => (cents/100).toLocaleString('lt-LT',{minimumFractionDigits:2,maximumFractionDigits:2});
export const isSigned = v => !!v.confirmation && v.confirmation.rev === v.rev;
export const isManager = actor => ['admin','coordinator'].includes(actor.role);
export function activeOn(c,day) { return (!c.decisionDate || c.decisionDate<=day) && (!c.decisionUntil || day<=c.decisionUntil) && (!c.contractFrom || c.contractFrom<=day) && (!c.contractUntil || day<=c.contractUntil); }
export function monthlyPlan(c,month) {
  const [first,last]=monthBounds(month);
  const from=[first,c.decisionDate||first,c.contractFrom||first].sort().at(-1);
  const to=[last,c.decisionUntil||last,c.contractUntil||last].sort()[0];
  if(from>to) return {hours:0,from,to,partial:false,active:false};
  const p=(c.plans||[]).filter(p=>p.from<=month && (!p.to || month<=p.to)).sort((a,b)=>a.from.localeCompare(b.from)).at(-1);
  return {hours:Number(p?.hours||0),from,to,partial:from!==first||to!==last,active:!!p};
}
export function allowedActivities(s,c) { return s.activities.filter(a=>a.active && c.allowed.includes(a.id)); }
export function usageWarning(s,c,month){
  const p=monthlyPlan(c,month),[from,to]=monthBounds(month),minutes=sumMinutes(visitsFor(s,{client:c.id,from,to}));
  if(!minutes || p.hours>0&&minutes<p.hours*60*Number(s.settings.threshold)/100)return '';
  return minutes>p.hours*60?`Viršytas mėnesio limitas: ${fmtHours(minutes)} iš ${p.hours} val.`:`Panaudota ${fmtHours(minutes)} iš ${p.hours} val. Artėjama prie mėnesio limito.`;
}
export function visitsFor(s,{client='',assistant='',from='',to='9999-12-31',source='actual'}={}) {
  return s.visits.filter(v=>v.endISO && (!client||v.client===client) && (!assistant||v.assistant===assistant) && v.date>=from && v.date<=to && (source!=='approved'||v.review==='approved') && (source!=='signed'||isSigned(v))).sort((a,b)=>a.startISO.localeCompare(b.startISO));
}
export function documentToken(s,doc) {
  return JSON.stringify(visitsFor(s,doc).map(v=>[v.id,v.rev,v.startISO,v.endISO,v.review,isSigned(v),v.assistant]));
}
export function staleDocument(s,doc) { return documentToken(s,doc)!==doc.token; }
export function canEditVisit(s,actor,v) {
  return actor.role==='assistant' && actor.assistantId===v.assistant && !!v.endISO && (v.review==='returned' || s.requests.some(r=>r.visit===v.id && r.rev===v.rev && r.assistant===actor.assistantId && r.status==='approved'));
}
export function canAccessClient(s,actor,c) { return isManager(actor) || actor.role==='assistant' && (c.assistant===actor.assistantId || s.visits.some(v=>v.client===c.id && v.assistant===actor.assistantId)); }
export function visibleDocs(s,actor,type) { return s[type].filter(d=>isManager(actor) || type==='serviceActs' && d.assistant===actor.assistantId && d.rows.every(v=>v.assistantId===actor.assistantId)); }
export function visitIssues(s,v) {
  const issues=[];
  if(!v.endISO) issues.push('Vizitas neužbaigtas');
  if(!v.activities.length) issues.push('Nepažymėtos veiklos');
  if(v.endISO && !isSigned(v) && !v.noSignReason) issues.push('Nėra gavėjo patvirtinimo arba priežasties');
  if(v.review==='returned') issues.push('Grąžintas taisyti');
  if(v.endISO && integerMinutes(v)===0) issues.push('Trukmė trumpesnė nei minutė');
  if(v.endISO && s.visits.some(x=>x.id!==v.id && x.assistant===v.assistant && x.endISO && Date.parse(x.startISO)<Date.parse(v.endISO) && Date.parse(x.endISO)>Date.parse(v.startISO))) issues.push('Persidengia su kitu asistento vizitu');
  return issues;
}
export function validateClient(s,c) {
  assert(c.name?.trim() && c.address?.trim(),'Įrašykite gavėjo vardą, pavardę ir adresą.');
  assert(s.assistants.some(a=>a.id===c.assistant && a.active),'Pasirinkite aktyvų asistentą.');
  assert(c.contract?.trim() && c.decision?.trim(),'Įrašykite sutarties ir sprendimo numerius.');
  for(const k of ['contractFrom','contractUntil','decisionDate','decisionUntil','disabilityUntil']) assert(!c[k]||validDay(c[k]),'Neteisinga data: '+k);
  assert(c.contractUntil && c.decisionDate && c.decisionUntil,'Nurodykite sutarties ir sprendimo galiojimą.');
  assert(c.decisionDate<=c.decisionUntil && (!c.contractFrom||c.contractFrom<=c.contractUntil),'Galiojimo pabaiga negali būti ankstesnė už pradžią.');
  assert(Array.isArray(c.allowed) && c.allowed.length && c.allowed.every(id=>s.activities.some(a=>a.id===id)),'Priskirkite bent vieną veiklą.');
  assert(Array.isArray(c.plans) && c.plans.length,'Nurodykite mėnesio valandų planą.');
  for(const p of c.plans) assert(/^\d{4}-(0[1-9]|1[0-2])$/.test(p.from) && Number.isFinite(p.hours) && p.hours>=0 && p.hours<=744,'Neteisingas valandų planas.');
}
export function migrate(raw) {
  assert(raw && Array.isArray(raw.clients) && Array.isArray(raw.visits) && Array.isArray(raw.assistants),'Netinkamas atsarginės kopijos formatas.');
  const s=clone(raw); s.version=VERSION;s.revision=Number(s.revision||0);
  s.activities=(s.activities||[]).map((a,i)=>typeof a==='string'?{id:'activity-'+i,name:a,active:true}:{...a,active:a.active!==false});
  const activity=x=>{if(typeof x==='object')return {...x};const a=s.activities.find(a=>a.id===x||a.name===x);return {id:a?.id||'legacy-'+x,name:a?.name||x};};
  s.clients.forEach(c=>{c.allowed=(c.allowed||[]).map(x=>activity(x).id); c.plans=Array.isArray(c.plans)?c.plans:[];c.finance=Array.isArray(c.finance)?c.finance:[];});
  s.visits.forEach(v=>{v.rev=Number(v.rev||1);v.activities=(v.activities||[]).map(activity);v.versions=(v.versions||[]).map(x=>({...x,activities:(x.activities||[]).map(activity)}));if(v.confirmation?.strokes?.length&& !Array.isArray(v.confirmation.strokes[0]))v.confirmation.strokes=[v.confirmation.strokes];});
  for(const k of ['schedule','requests','payments','serviceActs','audit','pending','reminded']) if(!Array.isArray(s[k]))s[k]=[];
  s.settings={days:30,threshold:90,offline:false,gps:false,...s.settings};s.online=s.online!==false;
  for(const d of [...s.payments,...s.serviceActs]) {
    d.status=d.status||'draft';if(!d.from&&d.month)[d.from,d.to]=monthBounds(d.month);d.assistant=d.assistant||'';
    d.name=d.name||d.data?.name||s.clients.find(c=>c.id===d.client)?.name||'';
    d.contract=d.contract||d.data?.contract||'';
    d.rows=(d.rows||[]).map(r=>{const v=s.visits.find(v=>v.id===r.id);return {...r,startISO:r.startISO||(v?.rev===r.rev?v.startISO:null),endISO:r.endISO||(v?.rev===r.rev?v.endISO:null),minutes:r.minutes??Math.round((r.hours||0)*60),assistantId:r.assistantId||v?.assistant,assistantName:r.assistantName||s.assistants.find(a=>a.id===v?.assistant)?.name};});
    d.minutes=d.minutes??(d.data?Math.round(d.data.hours*60):d.rows.reduce((n,r)=>n+r.minutes,0));
    if(d.data){d.finance=d.finance||{from:d.month,rate:d.data.rate,comp:d.data.comp,contribution:d.data.paid,rule:'manual',note:'Importuota iš v12; peržiūrėti.'};d.total=Math.round(d.data.total*100);d.paid=Math.round(d.data.paid*100);d.funded=Math.round(d.data.funded*100);}
    if(raw.version!==VERSION || !d.token)d.token='legacy-recreate';
  }
  return s;
}
export function loadState(storage,seed,factory) {
  // Naujausi įrenginio duomenys visada turi pirmenybę prieš HTML pradinę kopiją.
  for(const key of [STORAGE_KEY,'spic-v12','spic-v11','spic-v10']) {
    const value=storage.getItem(key);if(!value)continue;
    try{return migrate(JSON.parse(value));}catch(error){if(key===STORAGE_KEY)throw new Error('Nepavyko perskaityti išsaugotų duomenų. Eksportuokite esamą įrašą prieš atkūrimą. '+error.message);}
  }
  return seed ? migrate(seed) : factory();
}
export class Store {
  constructor(state,{storage=null,actor={role:'coordinator',assistantId:'a1'},now=()=>new Date()}={}) {this.s=migrate(state);this.storage=storage;this.actor=actor;this.now=now;}
  get day(){return localDay(this.now());}
  get stamp(){return this.now().toISOString();}
  manager(){assert(isManager(this.actor),'Šį veiksmą gali atlikti koordinatorius arba administratorius.');}
  admin(){assert(this.actor.role==='admin','Šį veiksmą gali atlikti administratorius.');}
  worker(){assert(this.actor.role==='assistant','Pasirinkite asistento aplinką.');assert(this.s.assistants.some(a=>a.id===this.actor.assistantId&&a.active),'Asistento paskyra neaktyvi.');}
  commit(action,target,fn,{offlineAllowed=true,networkControl=false}={}) {
    assert(networkControl || this.s.online || this.s.settings.offline && offlineAllowed,'Nėra ryšio. Šiam veiksmui reikia interneto.');
    if(this.storage){const latest=this.storage.getItem(STORAGE_KEY);if(latest)assert(Number(JSON.parse(latest).revision||0)===this.s.revision,'Duomenys pakeisti kitame lange. Atnaujinkite puslapį ir pakartokite veiksmą.');}
    const next=clone(this.s),result=fn(next);
    next.revision++;next.updatedAt=this.stamp;
    next.audit.unshift({id:uid('audit'),at:this.stamp,user:this.actor.role==='assistant'?this.actor.assistantId:this.actor.role,action,target});
    if(!next.online&&!networkControl){next.pending.push({id:uid('queue'),target,action,at:this.stamp});}
    if(this.storage)this.storage.setItem(STORAGE_KEY,JSON.stringify(next));
    this.s=next;return result;
  }
  setOnline(online) {
    const previous=this.s.online;this.s.online=online;
    try{return this.commit(online?'Ryšys atkurtas (demo)':'Ryšys atjungtas (demo)','ryšys',s=>{if(online){s.lastSync=this.stamp;s.pending=[];}},{networkControl:true});}catch(e){this.s.online=previous;throw e;}
  }
  activitySave(input) {this.admin();return this.commit('Veiklos išsaugojimas',input.id||'nauja',s=>{const name=input.name.trim();assert(name&&name.length<=150,'Veiklos pavadinimas turi būti 1–150 simbolių.');assert(!s.activities.some(a=>a.id!==input.id&&a.name.toLocaleLowerCase('lt')===name.toLocaleLowerCase('lt')),'Tokia veikla jau yra.');const a=s.activities.find(a=>a.id===input.id);if(a)a.name=name;else s.activities.push({id:uid('act'),name,active:true});});}
  activityToggle(id){this.admin();return this.commit('Veiklos aktyvumo pakeitimas',id,s=>{const a=s.activities.find(a=>a.id===id);assert(a,'Veikla nerasta.');a.active=!a.active;});}
  assistantSave(input) {this.admin();return this.commit('Asistento išsaugojimas',input.id||'naujas',s=>{assert(input.name.trim(),'Įrašykite vardą ir pavardę.');assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email),'Neteisingas el. paštas.');assert(!s.assistants.some(a=>a.id!==input.id&&a.email.toLowerCase()===input.email.toLowerCase()),'Šis el. paštas jau naudojamas.');const old=s.assistants.find(a=>a.id===input.id);if(old)Object.assign(old,{name:input.name.trim(),email:input.email.trim(),active:input.active});else s.assistants.push({id:uid('assistant'),name:input.name.trim(),email:input.email.trim(),active:true});});}
  clientSave(input) {this.manager();return this.commit('Gavėjo kortelės išsaugojimas',input.id||'naujas',s=>{validateClient(s,input);const existing=s.clients.find(c=>c.id===input.id);if(existing)Object.assign(existing,clone(input));else s.clients.push({...clone(input),id:uid('client')});});}
  scheduleSave(input) {
    this.worker();return this.commit(input.id?'Vizito plano perkėlimas':'Vizito planavimas',input.client,s=>{
      const c=s.clients.find(c=>c.id===input.client);assert(c&&c.assistant===this.actor.assistantId,'Galite planuoti tik savo gavėjų vizitus.');
      assert(validDay(input.date)&&input.date>=this.day&&/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time),'Pasirinkite šiandienos arba vėlesnę dieną ir atvykimo laiką.');
      assert(activeOn(c,input.date),'Pasirinktą dieną sprendimas arba sutartis negalioja.');
      const old=s.schedule.find(p=>p.id===input.id);if(old)assert(old.assistant===this.actor.assistantId&&old.status==='planned','Šio plano keisti nebegalima.');
      assert(!s.schedule.some(p=>p.id!==input.id&&p.assistant===this.actor.assistantId&&p.status==='planned'&&p.date===input.date&&p.time===input.time),'Šiuo laiku jau suplanuotas kitas vizitas.');
      if(old){assert(input.reason?.trim(),'Nurodykite perkėlimo priežastį.');old.history=old.history||[];old.history.push({date:old.date,time:old.time,reason:input.reason,at:this.stamp,by:this.actor.assistantId});Object.assign(old,{date:input.date,time:input.time,note:input.note});}
      else s.schedule.push({id:uid('plan'),client:c.id,assistant:this.actor.assistantId,date:input.date,time:input.time,note:input.note||'',status:'planned',history:[]});
    });
  }
  scheduleCancel(id,reason) {this.worker();assert(reason?.trim(),'Nurodykite atšaukimo priežastį.');return this.commit('Planuoto vizito atšaukimas',id,s=>{const p=s.schedule.find(p=>p.id===id);assert(p&&p.assistant===this.actor.assistantId&&p.status==='planned','Plano atšaukti negalima.');p.status='cancelled';p.cancelReason=reason;p.cancelledAt=this.stamp;});}
  startVisit(client,planId='') {
    this.worker();return this.commit('Vizito pradžia',client,s=>{
      const c=s.clients.find(c=>c.id===client);assert(c&&c.assistant===this.actor.assistantId,'Gavėjas jums nepriskirtas.');
      assert(!s.visits.some(v=>v.assistant===this.actor.assistantId&&!v.endISO),'Pirmiausia užbaikite jau pradėtą vizitą.');assert(activeOn(c,this.day),'Sprendimas arba sutartis negalioja.');assert(allowedActivities(s,c).length,'Gavėjui nepriskirta aktyvių veiklų.');
      const p=planId?s.schedule.find(p=>p.id===planId):null;
      if(planId)assert(p&&p.client===client&&p.assistant===this.actor.assistantId&&p.status==='planned','Netinkamas vizito planas.');
      if(p)assert(p.date===this.day,'Plano diena nesutampa su šiandiena. Perkelkite planą arba pradėkite atskirą neplanuotą vizitą.');
      const v={id:uid('visit'),client,assistant:this.actor.assistantId,date:this.day,startISO:this.stamp,endISO:null,activities:[],note:'',review:'running',rev:1,versions:[],confirmation:null,noSignReason:'',planId:planId||null};
      if(s.settings.gps)v.gpsStart={status:'demo',label:'Vietos fiksavimo demonstracija'};
      s.visits.push(v);if(p){p.status='running';p.visitId=v.id;}return v.id;
    });
  }
  finishVisit(id,activities,note) {
    this.worker();return this.commit('Vizito pabaiga',id,s=>{const v=s.visits.find(v=>v.id===id);assert(v&&v.assistant===this.actor.assistantId&&!v.endISO,'Vizito užbaigti negalima.');const c=s.clients.find(c=>c.id===v.client);const allowed=allowedActivities(s,c);assert(activities.length&&activities.every(id=>allowed.some(a=>a.id===id)),'Pasirinkite bent vieną šiuo metu leistiną aktyvią veiklą.');assert(Date.parse(this.stamp)>Date.parse(v.startISO),'Pabaiga turi būti vėlesnė už pradžią.');v.activities=activities.map(id=>({id,name:allowed.find(a=>a.id===id).name}));v.note=note||'';v.endISO=this.stamp;v.review='submitted';if(s.settings.gps)v.gpsEnd={status:'demo',label:'Vietos fiksavimo demonstracija'};const p=s.schedule.find(p=>p.id===v.planId);if(p)p.status='completed';});
  }
  signVisit(id,{name,strokes,reason}) {this.worker();return this.commit(reason?'Parašo negavimo priežastis':'Gavėjo vizito patvirtinimas',id,s=>{const v=s.visits.find(v=>v.id===id);assert(v&&v.assistant===this.actor.assistantId&&v.endISO,'Vizitas nerastas.');assert(v.review!=='approved','Patikrintas vizitas keičiamas tik gavus leidimą.');if(reason?.trim()){v.noSignReason=reason.trim();v.confirmation=null;}else{assert(name.trim()&&Array.isArray(strokes)&&strokes.some(line=>line.length>1),'Įrašykite pasirašančio asmens vardą ir pasirašykite.');v.confirmation={name:name.trim(),strokes:clone(strokes),at:this.stamp,rev:v.rev};v.noSignReason='';}});}
  requestCorrection(id,reason){this.worker();assert(reason?.trim(),'Nurodykite, ką ir kodėl norite taisyti.');return this.commit('Prašymas leisti taisyti',id,s=>{const v=s.visits.find(v=>v.id===id);assert(v&&v.endISO&&v.assistant===this.actor.assistantId,'Galite prašyti taisyti tik savo užbaigtą įrašą.');assert(!canEditVisit(s,this.actor,v),'Įrašą jau galite taisyti.');assert(!s.requests.some(r=>r.visit===id&&r.rev===v.rev&&['pending','approved'].includes(r.status)),'Prašymas jau pateiktas.');s.requests.push({id:uid('request'),visit:id,assistant:v.assistant,rev:v.rev,reason:reason.trim(),status:'pending',created:this.stamp});});}
  decideCorrection(id,approve,note){this.manager();assert(note?.trim(),'Įrašykite sprendimo komentarą.');return this.commit(approve?'Leidimas taisyti':'Prašymo atmetimas',id,s=>{const r=s.requests.find(r=>r.id===id),v=s.visits.find(v=>v.id===r?.visit);assert(r&&r.status==='pending'&&v?.rev===r.rev,'Prašymas nebeaktualus.');r.status=approve?'approved':'rejected';r.decisionNote=note;r.decidedAt=this.stamp;r.decidedBy=this.actor.role;});}
  reviewVisit(id,approve,note=''){this.manager();return this.commit(approve?'Vizito patikra':'Grąžinimas taisyti',id,s=>{const v=s.visits.find(v=>v.id===id);assert(v?.endISO,'Vizitas neužbaigtas.');if(approve){assert(!visitIssues(s,v).length,'Pirmiausia pašalinkite vizito patikros klaidas.');assert(!s.requests.some(r=>r.visit===id&&r.rev===v.rev&&['pending','approved'].includes(r.status)),'Pirmiausia užbaikite koregavimo prašymo eigą.');v.review='approved';v.reviewedBy=this.actor.role;v.reviewedAt=this.stamp;}else{assert(note.trim(),'Nurodykite grąžinimo priežastį.');v.review='returned';v.returnReason=note;s.requests.filter(r=>r.visit===id&&r.rev===v.rev&&r.status==='pending').forEach(r=>{r.status='approved';r.decisionNote=note;r.decidedAt=this.stamp;r.decidedBy=this.actor.role;});}});}
  editVisit(id,input) {this.worker();return this.commit('Vizito korekcija ir nauja versija',id,s=>{
    const v=s.visits.find(v=>v.id===id);assert(v&&canEditVisit(s,this.actor,v),'Šios įrašo versijos taisyti negalite.');
    assert(input.reason?.trim(),'Nurodykite pakeitimo priežastį.');const start=Date.parse(input.startISO),end=Date.parse(input.endISO);
    assert(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&end<=this.now().getTime(),'Nurodykite teisingą pradžią ir pabaigą. Pabaiga negali būti ateityje.');
    const c=s.clients.find(c=>c.id===v.client),available=[...allowedActivities(s,c),...v.activities];
    assert(input.activities.length&&input.activities.every(id=>available.some(a=>a.id===id)),'Netinkamos veiklos.');
    const {versions,...before}=v;versions.push({...clone(before),changedAt:this.stamp,changedBy:this.actor.assistantId,changeReason:input.reason.trim()});
    s.requests.filter(r=>r.visit===id&&r.rev===v.rev&&r.status==='approved').forEach(r=>{r.status='used';r.usedAt=this.stamp;});
    v.rev++;v.startISO=new Date(start).toISOString();v.endISO=new Date(end).toISOString();v.date=localDay(new Date(start));v.activities=input.activities.map(id=>clone(v.activities.find(a=>a.id===id)||available.find(a=>a.id===id)));v.note=input.note||'';v.review='submitted';v.confirmation=null;v.noSignReason='';v.returnReason='';v.reviewedAt=null;v.reviewedBy=null;
  });}
  financeSave(client,input){this.manager();return this.commit('Gavėjo mokėjimo parametrų išsaugojimas',client,s=>{const c=s.clients.find(c=>c.id===client);assert(c,'Gavėjas nerastas.');assert(/^\d{4}-(0[1-9]|1[0-2])$/.test(input.from),'Neteisingas galiojimo mėnuo.');assert(['manual','comp20','comp30'].includes(input.rule),'Netinkama skaičiavimo taisyklė.');for(const k of ['rate','comp','contribution'])assert(Number.isFinite(input[k])&&input[k]>=0,'Sumos negali būti neigiamos.');const term={from:input.from,rate:input.rate,comp:input.comp,contribution:input.contribution,rule:input.rule,note:input.note||''};c.finance=c.finance||[];c.finance=c.finance.filter(t=>t.from!==term.from);c.finance.push(term);});}
  createDocument(type,input){assert(['payments','serviceActs'].includes(type),'Netinkamas dokumento tipas.');if(type==='payments')this.manager();else if(this.actor.role==='assistant')this.worker();else this.manager();return this.commit('Dokumento projekto formavimas',type,s=>{
    const c=s.clients.find(c=>c.id===input.client);assert(c&&canAccessClient(s,this.actor,c),'Gavėjas nepasiekiamas.');
    assert(validDay(input.from)&&validDay(input.to)&&input.from<=input.to,'Neteisingas dokumento laikotarpis.');assert(validDay(input.issuedDate),'Neteisinga dokumento data.');
    const aid=this.actor.role==='assistant'?this.actor.assistantId:(input.assistant||'');
    assert(['actual','approved','signed'].includes(input.source),'Pasirinkite valandų šaltinį.');
    const query={client:c.id,assistant:aid,from:input.from,to:input.to,source:input.source};
    const rows=visitsFor(s,query);assert(rows.length,'Pasirinktu laikotarpiu nėra tinkamų užbaigtų vizitų.');
    const previous=input.previousId?s[type].find(d=>d.id===input.previousId):null;
    assert(!previous||previous.client===c.id,'Ankstesnio dokumento gavėjas nesutampa.');
    const number=(input.number||`${type==='payments'?'MP':'AKT'}-${input.issuedDate.slice(0,4)}-${String(s[type].length+1).padStart(4,'0')}`).trim();
    assert(number&&!s[type].some(d=>d.number===number&&(!previous||d.number!==previous.number)),'Toks dokumento numeris jau naudojamas.');
    const group=s[type].filter(d=>d.number===number);const version=Math.max(0,...group.map(d=>d.version||1))+1;
    assert(!group.length||previous?.number===number,'Pasikartojantis dokumento numeris.');
    const doc={id:uid('doc'),...query,name:c.name,contract:c.contract,number,version,issuedDate:input.issuedDate,provider:input.provider.trim(),status:'draft',created:this.stamp,generatedBy:this.actor.role==='assistant'?aid:this.actor.role,previousId:previous?.id||null,minutes:sumMinutes(rows),rows:rows.map(v=>({id:v.id,rev:v.rev,date:v.date,startISO:v.startISO,endISO:v.endISO,minutes:integerMinutes(v),assistantId:v.assistant,assistantName:s.assistants.find(a=>a.id===v.assistant)?.name||v.assistant,activities:clone(v.activities)}))};
    assert(doc.provider,'Įrašykite paslaugos teikėjo atstovą.');doc.token=documentToken(s,doc);
    if(type==='payments'){
      assert(monthOf(input.from)===monthOf(input.to),'Mokėjimo pranešimą formuokite vienam mėnesiui.');
      const f=input.finance;assert(f&&['manual','comp20','comp30'].includes(f.rule),'Gavėjo kortelėje nustatykite mokėjimo parametrus.');
      for(const k of ['rate','comp','contribution'])assert(Number.isFinite(f[k])&&f[k]>=0,'Neteisingi mokėjimo parametrai.');
      const total=Math.round(doc.minutes*f.rate*100/60),calculated=f.rule==='manual'?Math.round(f.contribution*100):Math.round(f.comp*(f.rule==='comp20'?20:30));
      doc.finance=clone(f);doc.total=total;doc.paid=Math.min(total,calculated);doc.funded=total-doc.paid;doc.month=monthOf(doc.from);
    }
    s[type].push(doc);return doc.id;
  },{offlineAllowed:false});}
  approveDocument(type,id,checked){this.manager();assert(checked,'Patvirtinkite, kad peržiūrėjote valandas, sumas ir dokumento duomenis.');return this.commit('Dokumento patvirtinimas spausdinti',id,s=>{const d=s[type]?.find(d=>d.id===id);assert(d&&!staleDocument(s,d),'Dokumento duomenys pasikeitė. Suformuokite naują versiją.');d.status='approved';d.approvedAt=this.stamp;d.approvedBy=this.actor.role;},{offlineAllowed:false});}
  documentForPrint(type,id){const d=visibleDocs(this.s,this.actor,type).find(d=>d.id===id);assert(d,'Dokumentas nepasiekiamas.');return {...clone(d),printDraft:d.status!=='approved'||staleDocument(this.s,d),stale:staleDocument(this.s,d)};}
  importRows(kind,parsed){this.admin();const preview=prepareImport(this.s,kind,parsed);assert(!preview.errors.length,preview.errors.join('\n'));return this.commit('Registro importas',kind,s=>{const staged=prepareImport(s,kind,parsed);assert(!staged.errors.length,staged.errors.join('\n'));s[kind]=staged.next;},{offlineAllowed:false});}
}
export const CLIENT_HEADERS=['id','name','assistant','address','phone','contact','group','age','contract','contractFrom','contractUntil','decision','decisionDate','decisionUntil','disabilityUntil','hours','planFrom','allowed'];
export const ASSISTANT_HEADERS=['id','name','email'];
export function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const delimiter=text.split(/\r?\n/)[0].includes(';')?';':',';const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell)throw new Error('Netaisyklingos CSV kabutės.');else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
  assert(!quoted,'CSV faile neuždarytos kabutės.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);assert(rows.length>1,'CSV faile nėra duomenų eilučių.');return rows;
}
export function prepareImport(s,kind,parsed){
  const headers=parsed[0].map(x=>x.trim()),allowed=kind==='clients'?CLIENT_HEADERS:ASSISTANT_HEADERS,errors=[],changes=[];let next=clone(s[kind]);
  if(!['clients','assistants'].includes(kind))return {errors:['Netinkamas registras.'],changes:[],next:[]};
  if(new Set(headers).size!==headers.length)errors.push('Pasikartoja stulpelių pavadinimai.');
  headers.filter(h=>!allowed.includes(h)).forEach(h=>errors.push('Neleistinas stulpelis: '+h));
  (kind==='clients'?['id','name','assistant','address','contract','contractUntil','decision','decisionDate','decisionUntil','hours','planFrom','allowed']:ASSISTANT_HEADERS).filter(h=>!headers.includes(h)).forEach(h=>errors.push('Trūksta stulpelio: '+h));
  if(parsed.length>501)errors.push('Vienu kartu galima importuoti iki 500 eilučių.');
  const ids=new Set();
  if(errors.length)return {errors,changes,next};
  parsed.slice(1).forEach((row,i)=>{try{
    assert(row.length===headers.length,'Nesutampa stulpelių skaičius.');const x=Object.fromEntries(headers.map((h,j)=>[h,row[j].trim()]));
    assert(x.id&&x.name,'Trūksta ID arba vardo.');assert(!ids.has(x.id),'Pasikartojantis ID.');ids.add(x.id);const old=next.find(c=>c.id===x.id);
    if(kind==='assistants'){
      assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email),'Neteisingas el. paštas.');assert(!next.some(a=>a.id!==x.id&&a.email.toLowerCase()===x.email.toLowerCase()),'El. paštas jau naudojamas.');const item={...(old||{}),id:x.id,name:x.name,email:x.email,active:old?.active!==false};if(old)Object.assign(old,item);else next.push(item);
    }else{
      assert(x.hours!==''&&Number.isFinite(Number(x.hours.replace(',','.'))),'Neteisingas valandų skaičius.');assert(/^\d{4}-(0[1-9]|1[0-2])$/.test(x.planFrom),'Neteisingas plano mėnuo.');
      const acts=x.allowed.split('|').map(name=>s.activities.find(a=>a.active&&(a.name===name.trim()||a.id===name.trim())));assert(acts.length&&acts.every(Boolean),'Nežinoma arba neaktyvi veikla.');
      const fields={...clone(old||{}),id:x.id,allowed:acts.map(a=>a.id),plans:clone(old?.plans||[]),finance:clone(old?.finance||[])};
      for(const key of CLIENT_HEADERS.filter(k=>!['id','allowed','hours','planFrom'].includes(k)))if(x[key]!==undefined)fields[key]=x[key];
      const p={from:x.planFrom,hours:Number(x.hours.replace(',','.'))};fields.plans=fields.plans.filter(p0=>p0.from!==p.from);fields.plans.push(p);validateClient(s,fields);if(old)Object.assign(old,fields);else next.push(fields);
    }
    changes.push({id:x.id,name:x.name,type:old?'Atnaujinti':'Sukurti',before:old?clone(s[kind].find(c=>c.id===x.id)):null});
  }catch(error){errors.push(`${i+2} eilutė: ${error.message}`);}});
  return {errors,changes,next:errors.length?clone(s[kind]):next};
}
export function csvCell(value){let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function toCSV(rows){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');}
export function seedState(now=new Date()) {
  const today=localDay(now),month=monthOf(today),year=today.slice(0,4),before=`${year}-01-01`,after=`${Number(year)+1}-12-31`;
  const activities=['Apsipirkimas','Maisto ruošimas','Pagalba buityje','Palydėjimas','Bendravimas','Asmens higiena'].map((name,i)=>({id:'act'+(i+1),name,active:true}));
  const assistants=[{id:'a1',name:'Rasa Kazlauskienė',email:'rasa@example.lt',active:true},{id:'a2',name:'Ieva Petrauskienė',email:'ieva@example.lt',active:true},{id:'a3',name:'Tomas Jonaitis',email:'tomas@example.lt',active:true}];
  const clients=[['c1','Vardenis Pavardenis','a1',200,'Judėjimo','65+','Klaipėda, Pavyzdžio g. 12'],['c2','Ona Pavyzdinė','a1',40,'Regos','18–64','Klaipėda, Parko g. 8'],['c3','Elena Demonstracinė','a2',32,'Kompleksinė','65+','Klaipėda, Sodų g. 4'],['c4','Jonas Pavyzdinis','a3',60,'Judėjimo','18–64','Klaipėda, Lauko g. 10']].map(([id,name,assistant,h,group,age,address],i)=>({id,name,assistant,group,age,address,phone:'+370 600 0000'+i,contact:'Artimasis · +370 600 1000'+i,contract:'AS-'+year+'-'+(i+1),contractFrom:before,contractUntil:after,decision:'SP-'+year+'-'+(i+1),decisionDate:before,decisionUntil:after,disabilityUntil:i===1?localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()+21)):after,allowed:activities.slice(0,i===1?3:6).map(a=>a.id),note:'Demonstraciniai duomenys',plans:[{from:year+'-01',hours:h}],finance:[{from:year+'-01',rate:12.13,comp:i===0?547.5:0,contribution:i===0?109.5:0,rule:i===0?'comp20':'manual',note:'Demonstracinis pavyzdys; realius dydžius tvirtina SPIC.'}]}));
  const visits=[];const pastDays=Math.min(19,Math.max(0,now.getDate()-1));
  for(let i=1;i<=pastDays;i++){const date=month+'-'+String(i).padStart(2,'0');visits.push({id:'v'+i,client:'c1',assistant:'a1',date,startISO:new Date(date+'T09:00:00').toISOString(),endISO:new Date(date+'T17:00:00').toISOString(),activities:[clone(activities[i%3])],note:'Pagalba pagal individualų planą.',review:'approved',rev:1,versions:[],confirmation:{name:'Vardenis Pavardenis',at:new Date(date+'T17:00:00').toISOString(),rev:1,demo:true},noSignReason:''});}
  const date=localDay(new Date(now.getFullYear(),now.getMonth(),Math.max(1,now.getDate()-1)));
  if(now.getDate()>1)visits.push({id:'v-review',client:'c3',assistant:'a2',date,startISO:new Date(date+'T10:00:00').toISOString(),endISO:new Date(date+'T11:30:00').toISOString(),activities:[clone(activities[3])],note:'Palydėjimas į gydymo įstaigą.',review:'submitted',rev:1,versions:[],confirmation:null,noSignReason:'Gavėja negalėjo pasirašyti. Dalyvavo artimasis.'});
  const tomorrow=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
  return {version:VERSION,revision:0,activities,assistants,clients,visits,schedule:[{id:'p1',client:'c2',assistant:'a1',date:today,time:'10:00',note:'Susitarta telefonu.',status:'planned',history:[]},{id:'p2',client:'c1',assistant:'a1',date:tomorrow,time:'09:00',note:'',status:'planned',history:[]},{id:'p3',client:'c3',assistant:'a2',date:today,time:'13:30',note:'Palydėjimas.',status:'planned',history:[]}],requests:[],payments:[],serviceActs:[],audit:[],pending:[],reminded:[],online:true,settings:{days:30,threshold:90,offline:false,gps:false}};
}
