// Throwaway preview of the agreed interaction; state is reset on reload.
const colors=['#d53939','#2461d9','#128247','#8734d0','#a75610','#a92975','#087d8b'];
const photo=document.querySelector('#photo'),wrap=document.querySelector('#photo-wrap'),labels=document.querySelector('#labels'),svg=document.querySelector('#leaders'),card=document.querySelector('#card');
let sample='daily1',expanded=new Set(),selected=null;
function start(key){sample=key;expanded=new Set(DATA[key].objects.slice(0,5).map((_,i)=>i));selected=null;photo.src=DATA[key].image;document.querySelectorAll('[data-sample]').forEach(b=>b.classList.toggle('active',b.dataset.sample===key));render();}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function render(){
 const objects=DATA[sample].objects;labels.replaceChildren();svg.replaceChildren();card.replaceChildren();const w=wrap.clientWidth,h=wrap.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const occupied=[];
 // Reserve collapsed targets so moved labels do not hide the remaining discovery dots.
 const dots=objects.flatMap((o,i)=>expanded.has(i)?[]:[{x:(o.bbox[0]+o.bbox[2])*w/2000,y:(o.bbox[1]+o.bbox[3])*h/2000}]);
 objects.forEach((o,i)=>{const x=(o.bbox[0]+o.bbox[2])*w/2000,y=(o.bbox[1]+o.bbox[3])*h/2000,color=colors[i%colors.length];
  if(!expanded.has(i)){const b=node('button','dot');b.style.cssText=`left:${x}px;top:${y}px;--color:${color}`;b.setAttribute('aria-label',`展开物体 ${i+1} 的英文标签`);b.onclick=()=>{expanded.add(i);render();};labels.append(b);return;}
  const b=node('button','word'+(selected===i?' selected':''),o.name_en);b.style.setProperty('--color',color);b.setAttribute('aria-pressed',selected===i);b.onclick=()=>{selected=i;render();};labels.append(b);
  const bw=b.offsetWidth,bh=b.offsetHeight,small=(o.bbox[2]-o.bbox[0])*w/1000<bw||(o.bbox[3]-o.bbox[1])*h/1000<bh;
  const candidates=small?[[x-bw/2,y-bh-26],[x-bw-18,y-bh/2],[x+18,y-bh/2]]:[[x-bw/2,y-bh/2]];
  candidates.push([x-bw/2,y-bh-18],[x-bw/2,y+18],[x-bw-18,y-bh/2],[x+18,y-bh/2],[x-bw/2,y-bh-52],[x-bw/2,y+48]);
  const boxes=candidates.map(([left,top])=>({left:Math.max(1,Math.min(w-bw-1,left)),top:Math.max(1,Math.min(h-bh-1,top)),width:bw,height:bh}));
  const overlap=(a,b)=>a.left<b.left+b.width+7&&a.left+a.width+7>b.left&&a.top<b.top+b.height+7&&a.top+a.height+7>b.top;
  const score=a=>occupied.filter(r=>overlap(a,r)).length*1000+dots.filter(p=>overlap(a,{left:p.x-8,top:p.y-8,width:16,height:16})).length*1000;
  const box=boxes.find(a=>score(a)===0)||boxes.reduce((a,b)=>score(a)<=score(b)?a:b);occupied.push(box);b.style.left=box.left+'px';b.style.top=box.top+'px';
  if(small||Math.abs(box.left+bw/2-x)>5||Math.abs(box.top+bh/2-y)>5){const line=document.createElementNS('http://www.w3.org/2000/svg','line');const sx=Math.max(box.left,Math.min(box.left+bw,x)),sy=Math.max(box.top,Math.min(box.top+bh,y));Object.entries({x1:sx,y1:sy,x2:x,y2:y,stroke:color,'stroke-width':1.5}).forEach(([k,v])=>line.setAttribute(k,v));svg.append(line);const p=document.createElementNS('http://www.w3.org/2000/svg','circle');Object.entries({cx:x,cy:y,r:3,fill:color,stroke:'white','stroke-width':1}).forEach(([k,v])=>p.setAttribute(k,v));svg.append(p);}
 });
 if(selected===null){card.append(node('h2','', '点标签，认识照片里的物品'),node('p','','点圆点展开英文，再点标签查看释义。已展开的标签会保留，也可以收起。'));}
 else{const o=objects[selected],color=colors[selected%colors.length];card.style.setProperty('--color',color);const heading=node('h2','',o.name_en);heading.style.color=color;const close=node('button','close','×');close.setAttribute('aria-label','关闭释义，保留标签');close.onclick=()=>{selected=null;render();};card.append(close,heading,node('div','meaning',o.name_zh));if(o.description)card.append(node('p','',o.description));const collapse=node('button','collapse','收起标签');collapse.onclick=()=>{expanded.delete(selected);selected=null;render();};card.append(collapse);}
 document.querySelector('#state').textContent=`当前：${expanded.size} 个英文标签 · ${objects.length-expanded.size} 个待展开圆点${selected===null?'':` · 正在查看 ${objects[selected].name_en}`}`;
}
document.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>start(b.dataset.sample));document.querySelector('#reset').onclick=()=>start(sample);document.querySelector('#choose').onclick=()=>start(sample==='daily1'?'flower1':'daily1');photo.onload=render;new ResizeObserver(()=>render()).observe(wrap);start(new URLSearchParams(location.search).get('sample')==='flower1'?'flower1':'daily1');
