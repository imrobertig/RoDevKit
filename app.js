const $ = (id) => document.getElementById(id);
let latestRows = [];

function money(n) {
  if (!Number.isFinite(n)) return "∞";
  const abs = Math.abs(n);
  if (abs >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return "$" + (n / 1e3).toFixed(2) + "K";
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function duration(seconds) {
  if (!Number.isFinite(seconds)) return "∞";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
function value(id, min, max) {
  const raw = Number($(id).value);
  return Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
}
function simulate() {
  const startCash = value("cash", 0, 1e12);
  const baseIncome = value("income", 0.1, 1e9);
  const firstCost = value("cost", 1, 1e12);
  const costMult = value("multiplier", 1, 10);
  const incomeMult = value("boost", 1, 10);
  const count = Math.round(value("count", 1, 100));
  let cash = startCash, income = baseIncome, cumulative = 0, totalCost = 0;
  const rows = [];
  for (let level = 1; level <= count; level++) {
    const cost = firstCost * Math.pow(costMult, level - 1);
    const wait = Math.max(0, (cost - cash) / income);
    cumulative += wait;
    cash = Math.max(0, cash - cost) + income * wait; // cash reaches the cost, then purchase it
    cash = Math.max(0, cash - cost);
    totalCost += cost;
    income *= incomeMult;
    rows.push({ level, cost, income, wait, cumulative, status: wait < 60 ? "Quick" : wait < 600 ? "Steady" : "Grind" });
  }
  latestRows = rows;
  const totalTime = rows.reduce((sum, row) => sum + row.wait, 0);
  $("total-time").textContent = duration(totalTime);
  $("total-cost").textContent = money(totalCost);
  $("final-income").textContent = money(income) + "/s";
  $("upgrade-rows").innerHTML = rows.map(r => `<tr><td class="level">#${r.level.toString().padStart(2,"0")}</td><td class="money">${money(r.cost)}</td><td>${money(r.income)}/s</td><td>${duration(r.wait)}</td><td><span class="status ${r.status === "Quick" ? "easy" : r.status === "Steady" ? "mid" : "hard"}">${r.status}</span></td></tr>`).join("");
  const maxWait = Math.max(...rows.map(r => r.wait));
  const slowest = rows.find(r => r.wait === maxWait);
  $("overview-text").textContent = `With the current inputs, buying ${count} upgrades takes an estimated ${duration(totalTime)} of active earning time. The slowest single purchase is upgrade #${slowest.level}, which takes ${duration(slowest.wait)}. This assumes income stays constant between purchases and the player always buys the next listed upgrade.`;
  $("overview-stats").innerHTML = [
    ["UPGRADES MODELED", count],
    ["SLOWEST PURCHASE", `#${slowest.level} · ${duration(slowest.wait)}`],
    ["COST MULTIPLIER", `${costMult.toFixed(2)}×`],
    ["INCOME MULTIPLIER", `${incomeMult.toFixed(2)}×`]
  ].map(([k,v]) => `<div class="overview-stat"><small>${k}</small><strong>${v}</strong></div>`).join("");
  const checks = [];
  if (costMult >= incomeMult * 1.15) checks.push(["warn", "Costs grow faster than income", "This can create a steep late-game grind. Consider reducing the cost multiplier or increasing the upgrade impact."]);
  else checks.push(["ok", "Cost and income growth are reasonably close", "Your income multiplier is keeping pace with cost growth in this simplified model. Playtest to verify the feel."]);
  if (maxWait > 1800) checks.push(["warn", "A major time wall exists", `At least one upgrade takes more than 30 minutes of modeled earning time. Check whether that wait is intentional.`]);
  else checks.push(["ok", "No single upgrade exceeds 30 minutes", "The model does not show an extreme individual wait, though total progression can still be long."]);
  if (incomeMult <= 1.05) checks.push(["warn", "Upgrades barely increase income", "An income multiplier near 1× can make purchases feel weak. Consider adding more meaningful jumps or other rewards."]);
  else checks.push(["ok", "Upgrades noticeably increase income", "Purchases raise income by a meaningful multiplier. Make sure the feedback is clear in-game."]);
  $("checks").innerHTML = checks.map(([type,title,desc]) => `<div class="check"><div class="check-mark ${type === "warn" ? "warn" : ""}">${type === "warn" ? "!" : "✓"}</div><div><h4>${title}</h4><p>${desc}</p></div></div>`).join("");
  drawChart(rows);
}
function drawChart(rows) {
  const canvas = $("chart");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = { l: 42, r: 12, t: 14, b: 20 };
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const vals = rows.map(r => r.cumulative / 60);
  const max = Math.max(1, ...vals);
  ctx.clearRect(0,0,w,h);
  ctx.font = '10px system-ui';
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + plotH * i / 4;
    ctx.strokeStyle = "#252c38"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    const label = max * (1 - i / 4);
    ctx.fillStyle = "#778294";
    ctx.fillText(label >= 60 ? `${(label/60).toFixed(1)}h` : `${Math.round(label)}m`, 2, y + 3);
  }
  const points = vals.map((v,i) => ({x: pad.l + (rows.length <= 1 ? 0 : i/(rows.length-1))*plotW, y: pad.t + plotH - (v/max)*plotH}));
  if (!points.length) return;
  ctx.beginPath(); points.forEach((p,i)=> i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
  ctx.lineTo(points[points.length-1].x,pad.t+plotH); ctx.lineTo(points[0].x,pad.t+plotH); ctx.closePath();
  const grad = ctx.createLinearGradient(0,pad.t,0,h); grad.addColorStop(0,"rgba(168,240,120,.20)"); grad.addColorStop(1,"rgba(168,240,120,0)");
  ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath(); points.forEach((p,i)=> i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
  ctx.strokeStyle="#a8f078";ctx.lineWidth=2;ctx.lineJoin="round";ctx.stroke();
  points.forEach((p,i)=> { if (i === 0 || i === points.length-1 || i % Math.ceil(points.length/8) === 0) {ctx.beginPath();ctx.arc(p.x,p.y,2.7,0,Math.PI*2);ctx.fillStyle="#a8f078";ctx.fill();}});
}
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${btn.dataset.view}`));
  $("crumb-title").textContent = btn.textContent.trim().replace(/^◈|^⌁|^⌘/, "").trim();
}));
$("simulate-btn").addEventListener("click", simulate);
$("csv-btn").addEventListener("click", () => {
  if (!latestRows.length) return;
  const lines = [["Level","Upgrade Cost","Income Per Second After Purchase","Wait Seconds","Cumulative Seconds"], ...latestRows.map(r => [r.level,r.cost,r.income,r.wait,r.cumulative])];
  const csv = lines.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="rodevkit-progression.csv"; a.click(); URL.revokeObjectURL(url);
});
$("reset-btn").addEventListener("click", () => {
  $("cash").value=25; $("income").value=3; $("cost").value=100; $("multiplier").value=1.35; $("boost").value=1.25; $("count").value=15; simulate();
});
window.addEventListener("resize", () => drawChart(latestRows));
simulate();
