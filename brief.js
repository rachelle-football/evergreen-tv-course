/* AI Creators · "Today's mission": the same clear brief at the top of every chapter,
   a reminder at the top of every mission, and the project strip (what you have, what you make today). */
(function(){
  const CH = +((location.pathname.match(/ch(\d)\.html/) || [])[1] || 0);
  const DN = n => n >= 8 ? n - 2 : n; /* the voice and video chapters were removed: file ch8 is Chapter 6, ch9 is Chapter 7 */
  const B = {
    1:{goal:"Discover what AI really is, and choose your part of the project.",
       make:[["🧭", "Your team and your part"], ["💡", "Your first idea for it"]],
       steps:["Play Real or AI?, and find the AI hidden in a normal day", "Learn how AI learns from examples", "Take the quick quiz", "Pick your team and your part, and write your first idea"],
       done:"Your team and your part are chosen (part 08).", missions:{8:"Choose your team and your part. You keep them until the exhibition."}},
    2:{goal:"Teach a real AI with your own drawings, then trick it and fix it.",
       make:[["🤖", "An AI you trained yourself"], ["📊", "Its exam score"]],
       steps:["Learn the 3 steps: examples, training, testing", "Teach the AI 3 new things by drawing", "Test it with 10 new drawings and count its score", "Trick it with wrong examples, then fix it"],
       done:"Your AI's exam score is filled in, and your team and part are checked (part 08).",
       missions:{3:"Teach the AI 3 things, then give it the exam. Your output: its score.", 6:"Teach it lies, test it, then fix it. Your output: the score before and after the fix.", 8:"Check your team and your part. From next week, everything you make is for them."}},
    3:{goal:"Design your part of the future with Gemini. This card is the plan for your whole project.",
       make:[["📝", "Your design card: a name, 3 big ideas, a day in it, and your own idea"]],
       steps:["Learn the 4 parts of a good prompt", "Click to build your prompt, then copy it", "Paste it in a NEW Gemini chat", "Paste Gemini's answer in the design card: it fills by itself", "Add one idea of your own that the AI did not have"],
       done:"All 6 boxes of your design card are filled. You cannot go on before that.",
       missions:{3:"Your output: your design card. Your story and your pictures use it."}},
    4:{goal:"Invent a hero, and write a story that happens inside your design.",
       make:[["🦸", "Your character card"], ["📖", "Your story (about 150 words) with a title"]],
       steps:["Learn the 4 parts of a story", "Invent your character, Gemini adds details", "Click to build your story prompt, Gemini writes it", "Paste it, give it a title, change 3 sentences into your own words", "Read it to the class"],
       done:"Your story has a title and at least 40 words. You cannot go on before that.",
       missions:{2:"Your output: your character card. Your hero appears in your story and your pictures.", 3:"Your output: your story, set in your design."}},
    5:{goal:"Make 3 to 5 AI pictures of your design, and save them in your folder.",
       make:[["🖼️", "3 to 5 pictures you choose (big picture, close-up, character…)"]],
       steps:["Spot what the AI decides by itself", "Learn the 5 ingredients of a picture prompt", "Choose which pictures you will make", "For each picture: click, copy, make it in Adobe Express, download", "Save each picture with ⬆ Upload"],
       done:"Every picture you chose is saved in your folder (green ✓). You cannot go on before that.",
       missions:{3:"Your output: your pictures, saved in your folder."}},
    8:{goal:"Build your own website with a strong prompt, and get your own link.",
       make:[["🌐", "Your website: about you, your dream job or your football team"], ["🔗", "Your own link to share"]],
       steps:["Learn what makes a website prompt strong", "Choose your topic", "Fill in your details, add your pictures, choose a style and colours: you see it change live", "Publish it and get your link", "A classmate tests it, you make it better"],
       done:"Your website is published with its own link, and the launch checklist is 7 of 7.",
       missions:{2:"Choose your topic: about me, when I grow up, or my football team.", 3:"Your output: your website, published, with your own link.", 4:"Your output: a feedback card for a classmate: a star and a wish.", 5:"Your output: a better website. Press Publish again when you are done."}},
    9:{goal:"Present your work to parents and guests, and launch the two team websites.",
       make:[["🎤", "Your 30-second pitch"], ["🚀", "Both team websites, live"]],
       steps:["Write your pitch line by line", "Rehearse it with a partner", "Pick your Expo job", "Launch day: present your page"],
       done:"You can say your pitch in 30 seconds, with your page open.",
       missions:{2:"Your output: your 30-second pitch. Practise it with the timer."}}
  }[CH];
  if (!B) return;
  const raw = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } };
  const words = t => (t || "").trim().split(/\s+/).filter(Boolean).length;
  const css = document.createElement("style");
  css.textContent = ".mbrief{border:2px solid var(--green,#1E7A55);background:var(--panel,#fff);border-radius:16px;padding:18px 20px;margin:0 0 22px}" +
    ".mbrief .mh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}.mbrief .mh b{font:700 12px/1 var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--green,#1E7A55)}" +
    ".mbrief .goal{font:700 22px/1.25 var(--display,inherit);margin:4px 0 14px;color:var(--ink,#13221C)}" +
    ".mbrief .mgrid{display:grid;grid-template-columns:1.1fr 1.3fr 1fr;gap:16px}.mbrief h4{margin:0 0 6px;font:700 12px/1 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#56665E)}" +
    ".mbrief .out{display:flex;gap:8px;align-items:flex-start;background:var(--green-soft,#E3F1E9);border-radius:10px;padding:8px 10px;margin:0 0 6px;font-weight:600;line-height:1.35}.mbrief .out span{font-size:20px;line-height:1}" +
    ".mbrief ol{margin:0;padding-left:20px;line-height:1.45}.mbrief ol li{margin:2px 0}.mbrief .done{margin:0;line-height:1.45}" +
    ".pstrip{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#D7DFD9)}.pstrip .ps{display:flex;align-items:center;gap:5px;font-size:13px;padding:5px 9px;border-radius:999px;border:1px solid var(--line,#D7DFD9);color:var(--muted,#56665E)}" +
    ".pstrip .ps.ok{background:var(--green-soft,#E3F1E9);border-color:var(--green,#1E7A55);color:var(--ink,#13221C)}.pstrip .ps.now{border:2px solid var(--gold,#C9932B);color:var(--ink,#13221C);font-weight:700}.pstrip .lbl{font:700 11px/1 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#56665E);align-self:center;margin-right:4px}" +
    ".mtask{display:flex;gap:10px;align-items:flex-start;border-left:4px solid var(--gold,#C9932B);background:var(--gold-soft,#FBF1DE);border-radius:10px;padding:10px 14px;margin:0 0 18px;font-weight:600;line-height:1.4;color:var(--ink,#13221C)}" +
    "@media (max-width:820px){.mbrief .mgrid{grid-template-columns:1fr}.mbrief .goal{font-size:19px}}";
  document.head.append(css);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.textContent = h; return e; };
  /* the 7 pieces of every student's project */
  const PIECES = [["card", "📝", "Design card", 3], ["story", "📖", "Story", 4], ["pics", "🖼️", "Pictures", 5], ["page", "🌐", "Website", 8], ["pitch", "🎤", "Pitch", 9]];
  async function have(){
    const c = raw("ch3-card") || {}, s = raw("ch4-story") || {}, p = raw("ch9-pitch") || {};
    const h = {card:!!(c.name && c.i1 && c.i2 && c.i3), story:!!((s.title || "").trim() && words(s.text) >= 40), pitch:["p1", "p2", "p3", "p4", "p5"].filter(k => (p[k] || "").trim()).length >= 4};
    if (window.F && window.F.on && window.F.on() && raw("ai-lab-session")){
      try { const fs = await window.F.list(true), k = raw("ch5-pics"), want = Array.isArray(k) && k.length ? k : ["big", "close", "char"], ok = x => fs.some(f => f.slot === x);
        h.pics = want.every(ok); h.page = ok("page"); } catch(e){}
    }
    return h;
  }
  function strip(){
    const box = el("div", "pstrip"); box.append(el("span", "lbl", "My project"));
    const draw = async () => { const h = await have();
      box.replaceChildren(el("span", "lbl", "My project"), ...PIECES.map(([k, ic, name, ch]) => { const d = el("span", "ps" + (h[k] ? " ok" : "") + (ch === CH ? " now" : ""));
        d.append(el("span", null, h[k] ? "✓" : ic), el("span", null, name + (ch === CH && !h[k] ? " · today" : ""))); d.title = "Chapter " + DN(ch); return d; })); };
    draw(); document.addEventListener("evg-files", draw); addEventListener("hashchange", () => setTimeout(draw, 200));
    return box;
  }
  function brief(){
    const b = el("section", "mbrief"); b.setAttribute("aria-label", "Today's mission");
    const h = el("div", "mh"); h.append(el("b", null, "🎯 Today's mission · Chapter " + DN(CH))); b.append(h, el("p", "goal", B.goal));
    const g = el("div", "mgrid");
    const c1 = el("div"); c1.append(el("h4", null, "You will make")); B.make.forEach(([i, t]) => { const o = el("p", "out"); o.append(el("span", null, i), el("b", null, t)); c1.append(o); });
    const c2 = el("div"); c2.append(el("h4", null, "Steps")); const ol = el("ol"); B.steps.forEach(s => ol.append(el("li", null, s))); c2.append(ol);
    const c3 = el("div"); c3.append(el("h4", null, "Done when"), el("p", "done", "✓ " + B.done));
    g.append(c1, c2, c3); b.append(g);
    if (CH >= 3) b.append(strip());
    return b;
  }
  function place(){
    const s1 = document.getElementById("seg-1"); if (!s1 || s1.querySelector(".mbrief")) return;
    const low = s1.querySelector(".lower"); (low ? low.after(brief()) : s1.prepend(brief()));
    Object.entries(B.missions || {}).forEach(([n, t]) => { const s = document.getElementById("seg-" + n); if (!s || s.querySelector(".mtask")) return;
      const m = el("div", "mtask"); m.append(el("span", null, "🎯"), el("span", null, t)); const lw = s.querySelector(".lower"); (lw ? lw.after(m) : s.prepend(m)); });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", place); else place();
})();
