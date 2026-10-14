(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "calfit_fresh_v1";
  const todayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const defaultState = () => ({
    selectedDate: todayKey(),
    goals: { calories: 2200, protein: 100, carbs: 250, fats: 70 },
    days: {},
    streak: 0
  });
  let state = loadState();
  let currentSlide = 0;
  let toastTimer;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      return saved && saved.goals && saved.days ? { ...defaultState(), ...saved, goals: { ...defaultState().goals, ...saved.goals } } : defaultState();
    } catch { return defaultState(); }
  }
  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }
  function dayData(key = state.selectedDate) {
    if (!state.days[key]) state.days[key] = { entries: [], steps: 0, burned: 0, water: 0, sleep: 0 };
    return state.days[key];
  }
  function num(value) { return Math.max(0, Number(value) || 0); }
  function sumEntries(entries, key) {
    return entries.reduce((sum, item) => sum + num(item[key]), 0);
  }
  function clampPercent(value, goal) { return Math.min(100, goal > 0 ? (value / goal) * 100 : 0); }
  function formatNumber(value) { return Math.round(value).toLocaleString("en-IN"); }
  function parseDate(key) { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d); }
  function shiftDate(key, amount) { const d = parseDate(key); d.setDate(d.getDate()+amount); return todayKey(d); }
  function shortMonth(date) { return date.toLocaleDateString("en-IN", { month:"long", year:"numeric" }); }

  function renderWeek() {
    const selected = parseDate(state.selectedDate);
    // Always show the week containing the selected day, Monday to Sunday.
    const monday = new Date(selected);
    const offset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - offset);
    $("monthLabel").textContent = shortMonth(selected);
    const strip = $("weekStrip");
    strip.innerHTML = "";
    for (let i=0; i<7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate()+i);
      const key = todayKey(d);
      const btn = document.createElement("button");
      btn.className = `day-button${key===state.selectedDate ? " selected" : ""}${key===todayKey() ? " today" : ""}`;
      btn.innerHTML = `<span class="day-name">${d.toLocaleDateString("en-IN",{weekday:"short"})}</span><span class="day-number">${d.getDate()}</span>`;
      btn.setAttribute("aria-pressed", String(key===state.selectedDate));
      btn.addEventListener("click", () => { state.selectedDate=key; saveState(); renderAll(); });
      strip.appendChild(btn);
    }
  }

  function renderNutrition() {
    const day = dayData();
    const calories = sumEntries(day.entries.filter(e=>e.type==="food"),"calories");
    const protein = sumEntries(day.entries.filter(e=>e.type==="food"),"protein");
    const carbs = sumEntries(day.entries.filter(e=>e.type==="food"),"carbs");
    const fats = sumEntries(day.entries.filter(e=>e.type==="food"),"fats");
    $("caloriesConsumed").textContent = formatNumber(calories);
    $("calorieGoalText").textContent = formatNumber(state.goals.calories);
    $("caloriesRemaining").textContent = formatNumber(Math.max(0,state.goals.calories-calories));
    $("calorieRing").style.setProperty("--progress", `${clampPercent(calories,state.goals.calories)*3.6}deg`);
    [["protein",protein],["carbs",carbs],["fats",fats]].forEach(([name,value]) => {
      $(`${name}Value`).textContent = formatNumber(value);
      $(`${name}Bar`).style.width = `${clampPercent(value,state.goals[name])}%`;
      const small = $(`${name}Bar`).closest(".macro-info").querySelector(".macro-label small");
      if (small) small.textContent = ` / ${formatNumber(state.goals[name])} g`;
    });
  }
  function renderActivity() {
    const day=dayData();
    $("burnedValue").textContent=formatNumber(day.burned);
    $("stepsValue").textContent=formatNumber(day.steps);
    $("distanceValue").textContent=(day.steps*0.00075).toFixed(1);
  }
  function renderWellness() {
    const day=dayData();
    $("waterText").textContent=`${day.water} / 8 glasses`;
    $("waterBar").style.width=`${clampPercent(day.water,8)}%`;
    $("sleepValue").textContent=Number(day.sleep).toFixed(day.sleep % 1 ? 1 : 0);
    $("sleepBar").style.width=`${clampPercent(day.sleep,8)}%`;
    $("streakCount").textContent=state.streak || 0;
  }
  function renderEntries() {
    const day=dayData();
    const entries=day.entries.slice().reverse();
    $("activityCount").textContent=`${entries.length} ${entries.length===1?"entry":"entries"}`;
    $("emptyState").hidden=entries.length>0;
    $("activityList").innerHTML="";
    entries.forEach(entry=>{
      const item=document.createElement("article");
      item.className="activity-entry";
      const icon=entry.type==="food"?"◒":"↗";
      const macros=entry.type==="food" ? `${formatNumber(entry.protein)}g protein · ${formatNumber(entry.carbs)}g carbs · ${formatNumber(entry.fats)}g fats` : "Activity logged";
      item.innerHTML=`<div class="entry-icon">${icon}</div><div class="entry-copy"><strong></strong><small>${macros}</small></div><div class="entry-calories">${formatNumber(entry.calories)}<small>kcal</small></div>`;
      item.querySelector(".entry-copy strong").textContent=entry.name;
      $("activityList").appendChild(item);
    });
  }
  function renderAll() {
    renderWeek(); renderNutrition(); renderActivity(); renderWellness(); renderEntries(); updateCarousel();
  }
  function updateCarousel() {
    $("carouselTrack").style.transform=`translateX(-${currentSlide*100}%)`;
    const titles=["Nutrition","Activity","Wellness"];
    $("activeSlideTitle").textContent=titles[currentSlide];
    document.querySelectorAll(".dot").forEach((dot,i)=>dot.classList.toggle("active",i===currentSlide));
  }
  function goToSlide(index) { currentSlide=(index+3)%3; updateCarousel(); }
  function showToast(message) {
    const toast=$("toast"); toast.textContent=message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2300);
  }
  function openDialog(id) { const dialog=$(id); if (typeof dialog.showModal==="function") dialog.showModal(); else dialog.setAttribute("open",""); }
  function openEntry(type="food") {
    $("entryType").value=type; $("modalTitle").textContent=type==="food"?"Log food":"Log activity";
    $("entryName").value=""; $("entryCalories").value=0; $("entryProtein").value=0; $("entryCarbs").value=0; $("entryFats").value=0;
    const food=type==="food";
    ["entryProtein","entryCarbs","entryFats"].forEach(id=>$(id).closest(".field").style.display=food?"flex":"none");
    $("formNote").textContent=food?"Enter the meal's calories and macros. Estimates are fine.":"Enter the activity name and calories burned, if known.";
    openDialog("entryDialog");
  }
  function saveEntry(event) {
    event.preventDefault();
    const type=$("entryType").value;
    const name=$("entryName").value.trim();
    if (!name) { showToast("Add a name first."); return; }
    const entry={ id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), type, name,
      calories:num($("entryCalories").value), protein:type==="food"?num($("entryProtein").value):0,
      carbs:type==="food"?num($("entryCarbs").value):0, fats:type==="food"?num($("entryFats").value):0 };
    const day=dayData(); day.entries.push(entry);
    if(type==="activity") day.burned+=entry.calories;
    state.streak=Math.max(state.streak,1);
    saveState(); $("entryDialog").close(); renderAll(); showToast(type==="food"?"Meal added to your day.":"Activity added to your day.");
  }
  function saveActivity(event) {
    event.preventDefault();
    const day=dayData();
    day.steps=num($("stepsInput").value); day.burned=num($("burnedInput").value);
    saveState(); $("activityDialog").close(); renderAll(); showToast("Activity updated.");
  }
  function saveGoals(event) {
    event.preventDefault();
    state.goals={calories:Math.max(500,num($("goalCalories").value)),protein:Math.max(1,num($("goalProtein").value)),carbs:Math.max(1,num($("goalCarbs").value)),fats:Math.max(1,num($("goalFats").value))};
    saveState(); $("settingsDialog").close(); renderAll(); showToast("Daily goals saved.");
  }
  function saveSleep(event) {
    event.preventDefault(); dayData().sleep=Math.min(24,num($("sleepInput").value));
    saveState(); $("sleepDialog").close(); renderWellness(); showToast("Sleep logged.");
  }

  $("prevSlide").addEventListener("click",()=>goToSlide(currentSlide-1));
  $("nextSlide").addEventListener("click",()=>goToSlide(currentSlide+1));
  document.querySelectorAll(".dot").forEach(dot=>dot.addEventListener("click",()=>goToSlide(Number(dot.dataset.slide))));
  let touchStartX=0, touchStartY=0;
  $("carouselViewport").addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].screenX;touchStartY=e.changedTouches[0].screenY;},{passive:true});
  $("carouselViewport").addEventListener("touchend",e=>{
    const dx=e.changedTouches[0].screenX-touchStartX, dy=e.changedTouches[0].screenY-touchStartY;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.2) goToSlide(currentSlide+(dx<0?1:-1));
  },{passive:true});
  document.querySelectorAll("[data-open-add]").forEach(btn=>btn.addEventListener("click",()=>openEntry("food")));
  document.querySelectorAll("[data-open-activity]").forEach(btn=>btn.addEventListener("click",()=>{const day=dayData();$("stepsInput").value=day.steps;$("burnedInput").value=day.burned;openDialog("activityDialog");}));
  $("navAdd").addEventListener("click",()=>openEntry("food"));
  $("entryType").addEventListener("change",()=>{const food=$("entryType").value==="food";$("modalTitle").textContent=food?"Log food":"Log activity";["entryProtein","entryCarbs","entryFats"].forEach(id=>$(id).closest(".field").style.display=food?"flex":"none");$("formNote").textContent=food?"Enter the meal's calories and macros. Estimates are fine.":"Enter the activity name and calories burned, if known.";});
  $("entryForm").addEventListener("submit",saveEntry);
  $("activityForm").addEventListener("submit",saveActivity);
  $("settingsForm").addEventListener("submit",saveGoals);
  $("sleepForm").addEventListener("submit",saveSleep);
  $("addWater").addEventListener("click",()=>{const day=dayData();day.water=Math.min(8,day.water+1);saveState();renderWellness();showToast("One glass of water added.");});
  $("editSleep").addEventListener("click",()=>{$("sleepInput").value=dayData().sleep||8;openDialog("sleepDialog");});
  $("todayButton").addEventListener("click",()=>{state.selectedDate=todayKey();saveState();renderAll();});
  $("streakButton").addEventListener("click",()=>showToast("Keep logging your daily habits to build consistency."));
  document.querySelectorAll(".nav-item").forEach(button=>button.addEventListener("click",()=>{
    const tab=button.dataset.tab;
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b===button));
    if(tab==="Settings") {
      $("goalCalories").value=state.goals.calories;$("goalProtein").value=state.goals.protein;$("goalCarbs").value=state.goals.carbs;$("goalFats").value=state.goals.fats;
      openDialog("settingsDialog");
    } else if(tab==="Progress") showToast("Progress view is planned for a later update.");
    else if(tab==="Meal Plan") showToast("Meal Plan is planned for a later update.");
    else if(tab==="Home") { window.scrollTo({top:0,behavior:"smooth"}); }
  }));

  // Ensure every modal's cancel button closes cleanly.
  document.querySelectorAll("dialog .close-button").forEach(button=>button.addEventListener("click",()=>button.closest("dialog").close()));
  renderAll();
})();
