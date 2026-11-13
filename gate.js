/* AI Creators · gates: a student cannot move past a mission until its piece of the project is done.
   Only for logged-in students (the teacher showing the course on the board is never blocked). */
(function(){
  const CH = +((location.pathname.match(/ch(\d)\.html/) || [])[1] || 0);
  /* after:n = a student cannot go past segment n until "need" is done */
  const RULES = {
    3:[{after:3, need:["card"]}],
    4:[{after:2, need:["card"]}, {after:3, need:["story"]}],
    5:[{after:2, need:["card"]}, {after:3, need:["pics"]}],
    8:[{after:3, need:["page"]}],
    9:[{after:1, need:["page"]}]
  }[CH];
  if (!RULES) return;
  const raw = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } };
  const student = () => { const a = raw("ai-lab-session"); return !!(a && a.token) && !sessionStorage.getItem("evg-teacher"); };
  const filesOn = () => !!(window.F && window.F.on && window.F.on());
  const words = t => (t || "").trim().split(/\s+/).filter(Boolean).length;
  const PICK = () => { const k = raw("ch5-pics"); return Array.isArray(k) && k.length ? k : ["big", "close", "char"]; };
  const LABEL = k => (window.PICKINDS && window.PICKINDS[k] && window.PICKINDS[k].label) || k;
  async function missing(need){
    const out = [];
    if (need.includes("card")){ const c = raw("ch3-card") || {}; const m = [!c.name && "a name", !(c.i1 && c.i2 && c.i3) && "3 big ideas", !(c.day || "").trim() && "a day in it", !(c.mine || "").trim() && "your own idea"].filter(Boolean);
      if (m.length) out.push({kind:"text", ch:3, text:"Your design card (Chapter 3) needs " + m.join(", ") + ".", href:"ch3.html#seg-3"}); }
    if (need.includes("story")){ const s = raw("ch4-story") || {}, c = raw("ch4-char") || {}; const m = [!c.name && "your character's name", !(s.title || "").trim() && "a title", words(s.text) < 40 && "the story itself (at least 40 words)"].filter(Boolean);
      if (m.length) out.push({kind:"text", ch:4, text:"Your story (Chapter 4) needs " + m.join(", ") + ".", href:"ch4.html#seg-" + (c.name ? 3 : 2)}); }
    const fileNeed = need.filter(n => ["pics", "page"].includes(n));
    if (fileNeed.length && filesOn()){
      let fs = []; try { fs = await window.F.list(true); } catch(e){ return out; }
      const has = s => fs.some(f => f.slot === s);
      if (fileNeed.includes("pics")){ const m = PICK().filter(k => !has(k)); if (m.length) out.push({kind:"file", ch:5, text:"Pictures not saved yet (Chapter 5): " + m.map(LABEL).join(", ") + "."}); }
      if (fileNeed.includes("page") && !has("page")) out.push({kind:"file", ch:8, text:CH === 8 ? "Your website is not published yet. Press 🌐 Publish my website first." : "Your website is not published yet (Chapter 6)."});
    }
    return out;
  }
  const segs = () => [...document.querySelectorAll("section.seg")];
  const curIdx = () => Math.max(0, segs().findIndex(s => !s.hidden));
  let pass = false;
  async function tryGo(target, redo){
    const rules = RULES.filter(r => target >= r.after); /* target is 0-based: going to index >= after means leaving segment "after" */
    const need = [...new Set(rules.flatMap(r => r.need))];
    const m = await missing(need);
    if (!m.length){ pass = true; try { redo(); } finally { pass = false; } return; }
    show(m, target, redo);
  }
  function intercept(e, target, redo){
    if (pass || !student() || target <= curIdx()) return;
    if (!RULES.some(r => target >= r.after)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    tryGo(target, redo);
  }
  document.addEventListener("click", e => {
    const nb = e.target.closest("#next"), st = e.target.closest("#steps .step");
    if (nb){ const el = nb; intercept(e, curIdx() + 1, () => el.click()); }
    else if (st){ const el = st, i = [...document.querySelectorAll("#steps .step")].indexOf(st); intercept(e, i, () => el.click()); }
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" || e.target.matches("textarea,input,select")) return;
    intercept(e, curIdx() + 1, () => document.querySelector("#next").click());
  }, true);
  /* the window */
  let dlg;
  function show(m, target, redo){
    if (!dlg){
      dlg = document.createElement("dialog"); dlg.className = "gate";
      const st = document.createElement("style");
      st.textContent = "dialog.gate{border:0;border-radius:18px;padding:0;max-width:560px;width:calc(100% - 32px);max-height:calc(100% - 32px);overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}dialog.gate::backdrop{background:rgba(10,20,15,.55)}.gate .gin{padding:22px}.gate h3{margin:0 0 6px;font-size:22px}.gate ul{margin:10px 0;padding-left:20px}.gate li{margin:6px 0;line-height:1.4}.gate .gact{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.gate .gfold{margin-top:12px}.gate a.btn{text-decoration:none}";
      document.head.append(st); document.body.append(dlg);
    }
    const files = m.some(x => x.kind === "file"), links = m.filter(x => x.href && x.ch !== CH);
    dlg.innerHTML = "";
    const box = document.createElement("div"); box.className = "gin";
    box.innerHTML = '<h3>✋ Not yet! Finish your piece first</h3><p class="muted" style="margin:0">Your project needs this before you go on:</p>';
    const ul = document.createElement("ul"); m.forEach(x => { const li = document.createElement("li"); li.textContent = x.text; ul.append(li); }); box.append(ul);
    if (files && CH !== 8 && window.F && window.F.folder){ const fb = document.createElement("div"); fb.className = "gfold card"; box.append(fb); window.F.folder(fb, CH); box.append(Object.assign(document.createElement("p"), {className:"muted", style:"font-size:14px;margin:6px 0 0", textContent:"Made it already? Press ⬆ Add and choose the file, then press Check again."})); }
    const act = document.createElement("div"); act.className = "gact";
    const again = document.createElement("button"); again.className = "btn"; again.type = "button"; again.textContent = "Check again";
    again.onclick = async () => { const mm = await missing([...new Set(RULES.filter(r => target >= r.after).flatMap(r => r.need))]); if (!mm.length){ dlg.close(); pass = true; try { redo(); } finally { pass = false; } } else show(mm, target, redo); };
    act.append(again);
    links.forEach(x => { const a = document.createElement("a"); a.className = "btn alt"; a.href = x.href; a.textContent = "Open Chapter " + (x.ch >= 8 ? x.ch - 2 : x.ch); act.append(a); });
    const stay = document.createElement("button"); stay.className = "btn alt"; stay.type = "button"; stay.textContent = "Stay here"; stay.onclick = () => dlg.close(); act.append(stay);
    box.append(act); dlg.append(box);
    if (!dlg.open) dlg.showModal();
  }
  window.EVG_GATE = {missing, rules:RULES};
})();
