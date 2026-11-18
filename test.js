const L = require('./lib.js'); const assert = require('assert');
const P = L.moonPhases(2026);
const exp = [
 ['full','2026-01-03T10:04'],['full','2026-02-01T22:10'],['full','2026-03-03T11:39'],['full','2026-04-02T02:13'],
 ['new','2026-01-18T19:53'],['new','2026-02-17T12:03'],['new','2026-03-19T01:26'],
 ['last','2026-01-10T15:49'],['last','2026-02-09T12:44'],['last','2026-03-11T09:41'],
 ['first','2026-01-26T04:48'],['first','2026-02-24T12:28'],['first','2026-03-25T19:19']];
for (const [ph, t] of exp) {
  const target = Date.parse(t + ':00Z');
  const f = P.find(e => e.phase === ph && Math.abs(e.date - target) < 3600e3);
  assert(f, `missing ${ph} ${t}`);
  const diff = Math.abs(f.date - target) / 60000;
  assert(diff <= 3, `${ph} ${t} off by ${diff.toFixed(1)} min`);
  console.log('ok', ph, t, diff.toFixed(1)+'min');
}
// Zurich bucketing: find phases within 1h of midnight UTC-ish
const ev = L.moonEvents(2026,'fr');
for (const [k,v] of Object.entries(ev)) for (const e of v) { const u=e.date.toISOString(); if (e.time && (e.date.getUTCHours()===23||e.date.getUTCHours()===0)) console.log('midnightish', e.phase,u,'->',k,e.time); }
// holidays
const H = L.holidaysFor(2026,{cantons:['VD','GE'],lang:'fr'});
const where = id => Object.entries(H).filter(([k,v])=>v.some(x=>x.id===id)).map(([k])=>k)[0];
const chk = (id,d)=>{assert.strictEqual(where(id),d,id+' '+where(id));console.log('ok',id,d)};
chk('goodfriday','2026-04-03');chk('eastermon','2026-04-06');chk('ascension','2026-05-14');chk('pentecostmon','2026-05-25');
chk('jeunefed','2026-09-21');chk('jeunegen','2026-09-10');
assert.strictEqual(L.easter(2027).toISOString().slice(0,10),'2027-03-28');
const H27 = L.holidaysFor(2027,{cantons:['VD','GE'],lang:'fr'});
console.log(Object.entries(H27).sort().map(([k,v])=>k+' '+v.map(x=>x.label).join('|')).join('\n'));
for (const y of [2026,2027,2028]) { console.log(y); const m=L.moonEvents(y,'fr'); for (const [k,v] of Object.entries(m).sort()) for(const e of v) if(e.phase==='full'&&k.startsWith(y)) console.log(' ',k,e.time,e.name); }
