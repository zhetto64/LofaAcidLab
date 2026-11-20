const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const engine=html.split('// Musical phrase engine:')[1].split('// End musical phrase engine.')[0];
const box={};vm.createContext(box);vm.runInContext('// Musical phrase engine:'+engine,box);
const {buildFunk,makeMidiBytes}=box;
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const config={root:36,scale:[0,2,3,5,7,9,10],steps:16,bars:4,density:.62,accent:.35,slide:.18,chaos:.35,leaps:.25};
function parse(bytes){
 const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'MThd');assert.equal(b.readUInt32BE(4),6);assert.equal(b.readUInt16BE(8),0);assert.equal(b.readUInt16BE(10),1);assert.equal(b.readUInt16BE(12),480);assert.equal(b.toString('ascii',14,18),'MTrk');assert.equal(b.readUInt32BE(18),b.length-22);
 let i=22,tick=0;const out=[];
 while(i<b.length){let dt=0,x;do{x=b[i++];assert.ok(x!==undefined);dt=dt*128+(x&127)}while(x&128);tick+=dt;const status=b[i++];if(status===255){const type=b[i++],len=b[i++];out.push({tick,status,type,data:[...b.subarray(i,i+len)]});i+=len}else{assert.ok([128,144,176,224].includes(status));const data=[b[i++],b[i++]];assert.ok(data.every(x=>x>=0&&x<=127));out.push({tick,status,data})}}
 return out;
}
test('all sizes/scales retain a recurring hook and playable notes',()=>{
 for(const scale of [[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10],[0,2,4,5,7,9,11],Array.from({length:12},(_,i)=>i)])for(let steps=1;steps<=32;steps++)for(const bars of [1,2,4,8]){
 const c={...config,scale,steps,bars,root:47},seq=buildFunk(c,rng(steps*bars));assert.equal(seq.length,steps*bars);assert.equal(seq[0].r,false);assert.equal(seq[0].n,c.root);
 for(let i=0;i<seq.length;i++){const s=seq[i],n=seq[(i+1)%seq.length];assert.ok(s.n>=24&&s.n<=84);assert.ok(scale.includes((s.n-c.root)%12));assert.ok(s.g>=.1&&s.g<=1);if(s.s)assert.ok(!s.r&&!n.r&&Math.abs(s.n-n.n)<=12)}
 for(let bar=1;bar<bars;bar++)for(let i=0;i<steps-Math.max(1,Math.ceil(steps*.25));i++)assert.equal(seq[i].n,seq[bar*steps+i].n);
 }
});
test('density and chaos endpoints preserve structure',()=>{
 const sparse=buildFunk({...config,density:.1,chaos:0},rng(1)),dense=buildFunk({...config,density:1,chaos:0},rng(1));assert.ok(sparse.filter(s=>!s.r).length<dense.filter(s=>!s.r).length);
 for(let bar=1;bar<4;bar++)assert.equal(JSON.stringify(sparse.slice(0,16).map(s=>[s.n,s.r,s.g,s.vel])),JSON.stringify(sparse.slice(bar*16,bar*16+16).map(s=>[s.n,s.r,s.g,s.vel])));
});
test('MIDI preserves pitch, gate, dynamics, rests, tempo and bend',()=>{
 const seq=[{n:36,a:true,s:true,r:false,g:.4},{n:43,a:false,s:false,r:false,g:.5,vel:58},{n:48,a:false,s:false,r:true}],events=parse(makeMidiBytes(seq,112));
 assert.deepEqual(events.filter(e=>e.status===144).map(e=>[e.tick,...e.data]),[[0,36,120],[120,43,58]]);
 assert.deepEqual(events.filter(e=>e.status===128).map(e=>e.tick),[120,180]);assert.equal(events.at(-1).tick,360);assert.equal(events.at(-1).type,47);
 const tempo=events.find(e=>e.type===81).data;assert.equal(tempo[0]*65536+tempo[1]*256+tempo[2],Math.round(60000000/112));
 assert.equal(events.filter(e=>e.status===224).length,11);assert.deepEqual(events.at(-2).data,[0,64]);
});
test('generated MIDI is balanced, monophonic and correctly sized over 100 seeds',()=>{
 for(let seed=0;seed<100;seed++){
  const seq=buildFunk(config,rng(seed)),events=parse(makeMidiBytes(seq,112));let active=null;
  for(const e of events){if(e.status===144){assert.equal(active,null);active=e.data[0]}if(e.status===128){assert.equal(active,e.data[0]);active=null}}assert.equal(active,null);assert.equal(events.at(-1).tick,7680);
  assert.ok(new Set(events.filter(e=>e.status===128).map((e,i)=>e.tick)).size>1);
 }
});
test('long-note probability controls actual sustained MIDI durations',()=>{
 const c={...config,steps:16,bars:4};let longCount=0,shortCount=0;
 for(let seed=0;seed<100;seed++){
  const off=buildFunk({...c,longNote:0},rng(seed)),on=buildFunk({...c,longNote:1},rng(seed));
  assert.ok(box.phrasePlan(off).notes.every(e=>e.span===1));
  assert.ok(box.phrasePlan(on).notes.some(e=>e.span>1));
  const countLong=seq=>box.phrasePlan(seq).notes.filter(e=>e.span>1).length;
  shortCount+=countLong(buildFunk({...c,longNote:.1},rng(seed)));longCount+=countLong(buildFunk({...c,longNote:.7},rng(seed)));
 }
 assert.ok(longCount>shortCount);
 const seq=[{n:36,r:false,len:4,a:false},{n:43,r:false},{n:48,r:false},{n:55,r:false},{n:41,r:false,g:.5}],events=parse(makeMidiBytes(seq,112));
 assert.deepEqual(events.filter(e=>e.status===144).map(e=>[e.tick,e.data[0]]),[[0,36],[480,41]]);
 assert.deepEqual(events.filter(e=>e.status===128).map(e=>e.tick),[476,540]);
 assert.deepEqual(Array.from(box.phrasePlan(seq).owners),[0,0,0,0,4]);
});
test('long notes clip at loop end and remain monophonic for all phrase sizes',()=>{
 for(let steps=1;steps<=32;steps++)for(const bars of [1,2,4,8]){
  const seq=buildFunk({...config,steps,bars,longNote:1},rng(steps*bars));let active=null;
  for(const event of box.phrasePlan(seq).notes){assert.ok(event.start+event.span<=seq.length);assert.ok(event.start%steps+event.span<=steps)}
  for(const e of parse(makeMidiBytes(seq,112))){if(e.status===144){assert.equal(active,null);active=e.data[0]}if(e.status===128){assert.equal(active,e.data[0]);active=null}}assert.equal(active,null);
 }
 const seq=[{n:36,r:true},{n:48,r:false,len:16}];assert.equal(box.phrasePlan(seq).notes[0].span,1);assert.equal(parse(makeMidiBytes(seq,112)).at(-1).tick,240);
});
test('preview gain sustains a long note until its release',()=>{
 const calls=[],param=()=>({value:0,setValueAtTime:(value,t)=>calls.push(['set',value,t]),exponentialRampToValueAtTime:(value,t)=>calls.push(['ramp',value,t])});
 const context={currentTime:0,createOscillator:()=>({frequency:param(),connect(){},disconnect(){},start(){},stop:t=>calls.push(['stop',t])}),createBiquadFilter:()=>({Q:{},frequency:param(),connect(){},disconnect(){}}),createGain:()=>({gain:param(),connect(){},disconnect(){}})};
 const audioBox={ctx:context,mix:{},waveform:()=> 'sawtooth',v:id=>({res:75,cutoff:700,env:70,decay:260}[id]),hz:n=>440*Math.pow(2,(n-69)/12),voices:new Set(),setTimeout:()=>1,clearTimeout(){},updateVoice(){}};
 vm.createContext(audioBox);const source=html.split('function beep(')[1].split('function drum(')[0];vm.runInContext('function beep('+source,audioBox);audioBox.beep(36,1,.125,false,null,7.97,85);
 const sustain=calls.find(e=>e[0]==='set'&&e[1]===.23&&e[2]>1.9);assert.ok(sustain,'constant gain reaches the end of the long note');assert.ok(calls.find(e=>e[0]==='stop')[1]>1.99);
});
