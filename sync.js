/* Saves every chapter's progress to the student's account. Loaded at the end of each chapter page. */
(function(){
  var C = window.EVG_CLOUD || {}, on = !!(C.url && C.key), SESS = "ai-lab-session", RX = /^(ch[1-9]-|meet-ai-)/;
  var acc = null; try { acc = JSON.parse(localStorage.getItem(SESS) || "null"); } catch(e) {}
  if (on && !acc){ location.replace("index.html"); return; }
  var css = document.createElement("style");
  css.textContent = ".evg-back{font:700 14px/1 var(--body,system-ui);color:var(--green,#1E7A55);text-decoration:none;border:1px solid var(--line,#ccc);border-radius:8px;padding:7px 10px;white-space:nowrap}.evg-save{font:700 12px/1 var(--mono,monospace);color:var(--muted,#666);white-space:nowrap}.evg-save.warn{color:var(--onair,#c00)}";
  document.head.appendChild(css);
  var wrap = document.querySelector(".top .wrap") || document.body;
  var back = document.createElement("a"); back.href = "index.html"; back.className = "evg-back"; back.textContent = "← All chapters";
  var save = document.createElement("span"); save.className = "evg-save";
  wrap.insertBefore(back, wrap.firstChild);
  var clock = wrap.querySelector(".clock"); if (clock) clock.insertBefore(save, clock.firstChild); else wrap.appendChild(save);
  function setSave(t, warn){ save.textContent = t; save.className = "evg-save" + (warn ? " warn" : ""); }
  if (!on){ setSave("Saved on this computer"); return; }
  setSave((acc.name || acc.username) + " · ☁ Saved");
  function snap(){ var o = {}; for (var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if (RX.test(k)) o[k] = localStorage.getItem(k); } return o; }
  var last = JSON.stringify(snap()), busy = false;
  function push(keepalive){
    var s = snap(), j = JSON.stringify(s); if (j === last || busy) return; busy = true; setSave("Saving…");
    fetch(C.url.replace(/\/+$/, "") + "/rest/v1/rpc/ailab_course_save", {method:"POST", keepalive: !!keepalive,
      headers: Object.assign({"apikey": C.key, "Content-Type": "application/json"}, /^eyJ/.test(C.key) ? {"Authorization": "Bearer " + C.key} : {}),
      body: JSON.stringify({p_token: acc.token, p_data: s})})
    .then(function(r){ return r.text().then(function(t){ var m = null; try { m = JSON.parse(t); } catch(e) {} if (!r.ok) throw {code: (m && m.message) || ("http_" + r.status)}; }); })
    .then(function(){ last = j; setSave((acc.name || acc.username) + " · ☁ Saved"); })
    .catch(function(e){ if (e && e.code === "not_logged_in"){ setSave("Please log in again", true); setTimeout(function(){ location.href = "index.html"; }, 1500); } else setSave("Offline: will save later", true); })
    .then(function(){ busy = false; });
  }
  setInterval(push, 3000);
  addEventListener("pagehide", function(){ push(true); });
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") push(true); });
})();
