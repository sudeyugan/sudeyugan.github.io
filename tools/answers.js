/* Owner-only editing workflow; browser drafts never override the site's answer file. */
(() => {
  'use strict';
  const D=window.CONNECTION_DATA,key='sudeyugan.owner-answers.v1',$=s=>document.querySelector(s);
  const groups={reading:'阅读',games:'游戏',anime:'动漫',stories:'故事偏好',music:'音乐',self:'自己',social:'相处方式',values:'观念'};
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  function clean(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('答案必须是题目 ID 与选项字母的对应对象。');
    const out={};for(const [id,answer]of Object.entries(input)){
      const q=D.questions.find(q=>q.id===id);if(!q||!q.options.some(o=>o.id===answer))throw Error('答案包含无法识别的题目或选项：'+id);out[id]=answer;
    }return out;
  }
  const signature=answers=>JSON.stringify(Object.fromEntries(D.questions.filter(q=>Object.hasOwn(answers,q.id)).map(q=>[q.id,answers[q.id]])));
  const source=clean(D.ownerAnswers),sourceSignature=signature(source);
  let answers={...source},filter='all',draft=null,conflictDraft=null,handle=null,saving=false,storageAvailable=true;
  const message=text=>$('#editor-status').textContent=text;
  try{
    const saved=localStorage.getItem(key);if(saved){
      draft=JSON.parse(saved);const restored=clean(draft.answers);
      if(draft.base===sourceSignature||signature(restored)===sourceSignature)answers=restored;
      else{conflictDraft={...restored};$('#restore-draft').hidden=false;message('答案文件有更新，已优先读取文件；需要时可以恢复旧的本地草稿。');}
    }
  }catch{message('未能读取本地草稿，已载入答案文件。');}
  function persist(){
    const savedAt=Date.now();try{
      localStorage.setItem(key,JSON.stringify({answers,base:sourceSignature,savedAt}));draft={answers:{...answers},base:sourceSignature,savedAt};
      $('#draft-time').textContent='草稿已保存 · '+new Date(savedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    }catch{storageAvailable=false;message('此浏览器不能保存草稿，请保存或下载答案文件来保留选择。');}
  }
  const matches=(q,id)=>id==='all'||(id==='missing'&&!Object.hasOwn(answers,q.id))||q.group===id;
  function update(){
    const count=Object.keys(answers).length,changed=signature(answers)!==sourceSignature;
    $('#count').textContent=count;$('.count-total').textContent='/ '+D.questions.length;$('#dock-count').textContent=`${count} / ${D.questions.length} 已选`;
    $('#dock-progress').max=D.questions.length;$('#dock-progress').value=count;
    $('#save-state').textContent=changed?'草稿已修改 · 待保存到答案文件':count===D.questions.length?'全部填写完成 · 已与文件一致':`答案文件已填写 ${count} / ${D.questions.length} 题`;
    $('#save-explanation').textContent=changed?(storageAvailable?'选择已在此浏览器保留。保存到 assets/owner-answers.js，刷新主页后用于真实匹配。':'请保存到答案文件保留选择。'):count<D.questions.length?'新增题可以通过“尚未填写”集中补答；已保存的旧答案会保留。未填写的新题暂不计分。':'之后也可以继续修改；保存文件并刷新主页后生效。';
    for(const b of document.querySelectorAll('[data-filter]')){
      const id=b.dataset.filter,qs=D.questions.filter(q=>matches(q,id));
      b.lastElementChild.textContent=id==='missing'?String(qs.length):`${qs.filter(q=>Object.hasOwn(answers,q.id)).length}/${qs.length}`;
      b.setAttribute('aria-pressed',String(filter===id));
    }
  }
  for(const [id,label]of [['all','全部问题'],['missing','尚未填写'],...Object.entries(groups)]){
    const b=node('button',undefined,'filter');b.type='button';b.dataset.filter=id;b.append(node('b',label),node('span'));b.firstChild.style.fontWeight='400';
    b.addEventListener('click',()=>{filter=id;render();});$('#categories').append(b);
  }
  function render(){
    const list=$('#questions');list.replaceChildren();const qs=D.questions.filter(q=>matches(q,filter));
    for(const q of qs){
      const filled=Object.hasOwn(answers,q.id),index=D.questions.indexOf(q)+1,card=node('article',undefined,'question-card'+(filled?' is-filled':'')),meta=node('div',undefined,'question-meta');
      const clear=node('button','清空','question-clear');clear.type='button';clear.disabled=!filled;clear.setAttribute('aria-label','清空第 '+index+' 题的答案');
      clear.addEventListener('click',()=>{delete answers[q.id];message('');persist();render();});
      meta.append(node('span',String(index).padStart(2,'0')+' / '+groups[q.group]+(q.requiresOwnerAnswer&&!filled?' · 新增待填':'')),clear);
      const heading=node('h2',q.prompt);heading.id='question-'+q.id;card.append(meta,heading);
      if(q.parent){const parent=D.questions.find(p=>p.id===q.parent);card.append(node('p','来访者在“'+parent.prompt.replace('？','')+'”选择喜欢后，才会抽到本题。','branch-label'));}
      const field=node('fieldset');field.append(node('legend',q.prompt));field.setAttribute('aria-labelledby',heading.id);
      q.options.forEach((o,i)=>{
        const label=node('label',undefined,'option'),radio=node('input');radio.type='radio';radio.name=q.id;radio.value=o.id;radio.checked=answers[q.id]===o.id;
        radio.addEventListener('change',()=>{answers[q.id]=o.id;clear.disabled=false;card.classList.add('is-filled');message('');persist();update();});
        label.append(radio,node('span',String.fromCharCode(65+i),'option-letter'),node('span',o.label));field.append(label);
      });card.append(field);list.append(card);
    }
    if(!qs.length)list.append(node('p','这一组已经填好了。','branch-label'));update();
  }
  const ask=(title,text,confirm='确认恢复')=>new Promise(resolve=>{
    const dialog=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-copy').textContent=text;dialog.querySelector('[value=confirm]').textContent=confirm;
    dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});dialog.showModal();
  });
  $('#restore-file').addEventListener('click',async()=>{
    if(signature(answers)!==sourceSignature&&!await ask('恢复文件中的答案？','当前草稿将被打开设置页时读取的文件版本替换。'))return;
    answers={...source};persist();render();message('已恢复为文件中的答案。');
  });
  $('#restore-draft').addEventListener('click',async()=>{
    if(!conflictDraft||!await ask('恢复旧的本地草稿？','当前选择会被旧草稿替换，原答案文件不会改变。','恢复草稿'))return;
    answers=clean(conflictDraft);conflictDraft=null;persist();render();$('#restore-draft').hidden=true;message('已恢复草稿，保存到答案文件后生效。');
  });
  const output=()=>`/* 由 tools/answers.html 保存。只包含本人选项，不保存访客回答。 */\nwindow.CONNECTION_OWNER_ANSWERS = ${JSON.stringify(JSON.parse(signature(answers)),null,2)};\n`;
  function download(){
    const url=URL.createObjectURL(new Blob([output()],{type:'text/javascript;charset=utf-8'})),a=node('a');a.href=url;a.download='owner-answers.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);persist();
    $('#save-state').textContent='已下载 · 替换文件后生效';message('将下载的 owner-answers.js 替换到主页的 assets 文件夹，再刷新主页。');
  }
  $('#download-file').addEventListener('click',download);
  $('#save-file').addEventListener('click',async()=>{
    if(saving)return;if(!window.showSaveFilePicker){download();return;}saving=true;$('#save-file').disabled=true;$('#dock-save').disabled=true;let writer;
    try{
      if(!handle)handle=await window.showSaveFilePicker({suggestedName:'owner-answers.js',id:'sudeyugan-owner-answers',types:[{description:'本人答案 JavaScript',accept:{'text/javascript':['.js']}}]});
      if(handle.name!=='owner-answers.js'){handle=null;throw Error('请保存为 owner-answers.js，并放入主页的 assets 文件夹。');}
      writer=await handle.createWritable();await writer.write(output());await writer.close();writer=null;persist();$('#save-state').textContent='已写入答案文件';
      message('已保存 owner-answers.js。若选择的是主页 assets 中的文件，刷新主页即可生效；其他位置的文件请先移入 assets 文件夹。');
    }catch(error){
      if(writer)try{await writer.abort();}catch{}handle=null;message(error.name==='AbortError'?'已取消保存，当前选择保留。':'未写入文件：'+error.message+' 也可以下载答案文件。');
    }finally{saving=false;$('#save-file').disabled=false;$('#dock-save').disabled=false;}
  });
  $('#import-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;try{
      if(file.size>100000)throw Error('文件过大，请选择答案文件。');
      const text=(await file.text()).replace(/^\uFEFF/,'').trim();let data;
      if(file.name.toLowerCase().endsWith('.json'))data=JSON.parse(text);
      else{const match=text.replace(/^\/\*[\s\S]*?\*\/\s*/,'').match(/^window\.CONNECTION_OWNER_ANSWERS\s*=\s*([\s\S]*?)\s*;?\s*$/);if(!match)throw Error('请选择导出的 owner-answers.js 或答案 JSON。');data=JSON.parse(match[1]);}
      const imported=clean(data);if(!await ask('导入这份答案？',`将用文件中的 ${Object.keys(imported).length} 个答案替换当前草稿。原文件不会自动改变。`,'导入答案'))return;
      answers=imported;persist();render();message('已导入，保存到答案文件后生效。');
    }catch(error){message('未导入：'+error.message);}finally{e.target.value='';}
  });
  $('#dock-save').addEventListener('click',()=>$('#save-file').click());
  $('#back-top').addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  render();if(draft?.savedAt)$('#draft-time').textContent='上次草稿 · '+new Date(draft.savedAt).toLocaleString('zh-CN');
  if(!window.showSaveFilePicker)$('#save-file').textContent='导出答案文件 ↗';
})();
