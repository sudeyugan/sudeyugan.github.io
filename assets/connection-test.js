/* Adaptive questions, a protected reflection budget, and graded comparisons. */
(() => {
  'use strict';
  const D=window.CONNECTION_DATA;
  const settings=D.test;
  const shuffle=(items,random=Math.random)=>{const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const positive=answer=>answer==='a'||answer==='b';
  const available=(q,answers)=>!q.parent||positive(answers[q.parent]);
  const reflection=q=>!q.root&&!q.parent&&q.group!=='music';
  const pickBalanced=(pool,history,random)=>{
    if(!pool.length)return null;
    const counts={};for(const q of history.filter(reflection))counts[q.group]=(counts[q.group]||0)+1;
    const lowest=Math.min(...pool.map(q=>counts[q.group]||0));
    return shuffle(pool.filter(q=>(counts[q.group]||0)===lowest),random)[0];
  };
  function next(history,answers,limit=settings.initial,random=Math.random){
    if(history.length>=limit)return null;
    const used=new Set(history.map(q=>q.id)),roots=D.roots.filter(id=>!used.has(id));
    // Space the four interest gates across the first ten questions: 1, 4, 7, 10.
    const rootsSeen=D.roots.length-roots.length;
    if(roots.length&&(history.length>=rootsSeen*3||limit-history.length<=roots.length))return D.questions.find(q=>q.id===roots[0]);
    const pool=D.questions.filter(q=>!q.root&&!used.has(q.id)&&available(q,answers));
    const details=history.filter(q=>!q.root&&!reflection(q)).length;
    const detailLimit=settings.detailLimit+(history.length>=settings.initial?2:0);
    const last=history.at(-1),children=last?.root&&positive(answers[last.id])?pool.filter(q=>q.parent===last.id):[];
    if(children.length&&details<detailLimit&&random()<Math.min(1,(detailLimit-details)/(roots.length+1)))return shuffle(children,random)[0];
    const detailPool=pool.filter(q=>!reflection(q));
    if(details<detailLimit&&detailPool.length&&history.length%5===4)return shuffle(detailPool,random)[0];
    const personal=pickBalanced(pool.filter(reflection),history,random);
    if(personal)return personal;
    // Only relevant if the bank is later shortened; never violate a closed interest gate.
    if(roots.length)return D.questions.find(q=>q.id===roots[0]);
    return details<detailLimit?shuffle(detailPool,random)[0]||null:null;
  }
  function pendingOwner(q){return q.requiresOwnerAnswer&&!Object.hasOwn(D.ownerAnswers,q.id);}
  function compare(q,answer){
    if(pendingOwner(q))return null;
    const theirs=q.options.find(o=>o.id===answer),owner=D.ownerAnswers[q.id],mine=q.options.find(o=>o.id===(owner??q.preview));
    if(!theirs||theirs.skip||!mine||mine.skip)return null;
    if(q.similarity){const i=q.options.indexOf(mine),j=q.options.indexOf(theirs);return q.similarity[i][j];}
    const a=Array.isArray(mine.value)?mine.value:[mine.value],b=Array.isArray(theirs.value)?theirs.value:[theirs.value];
    const distance=Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0)/a.length);
    return Math.max(.15,Math.min(1,1-.85*distance));
  }
  function result(history,answers){
    const rows=history.map(q=>({id:q.id,group:q.group,score:compare(q,answers[q.id]),weight:q.weight}));
    const groups=new Map();for(const r of rows){if(r.score===null)continue;const g=groups.get(r.group)||{sum:0,weight:0};g.sum+=r.score*r.weight;g.weight+=r.weight;groups.set(r.group,g);}
    const dimensions=[...groups.values()].map(g=>g.sum/g.weight),compared=rows.filter(r=>r.score!==null).length;
    const awaiting=history.filter(q=>pendingOwner(q)&&q.options.some(o=>o.id===answers[q.id]&&!o.skip)).length;
    return {score:dimensions.length?dimensions.reduce((a,b)=>a+b,0)/dimensions.length:null,dimensions,rows,compared,total:history.length,pendingOwner:awaiting,demo:history.some(q=>compare(q,answers[q.id])!==null&&!Object.hasOwn(D.ownerAnswers,q.id))};
  }
  window.ConnectionTest={next,compare,result,positive,available,reflection,pendingOwner,settings};
})();
