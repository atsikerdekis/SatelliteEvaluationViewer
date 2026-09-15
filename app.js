const els = Object.fromEntries(["month","sensor","statistic","variable","figure","empty","stage","figure-title","figure-kicker","open-image","previous","next","previous-label","next-label","position","figure-count"].map(id => [id, document.getElementById(id)]));

const sensorNames = {
  MOD:"MODIS Terra",
  MYD:"MODIS Aqua",
  VIIRS_SNPP:"VIIRS SNPP",
  MOD_MYD_VIIRS_SNPP:"All satellites",
  SPEXone:"SPEXone"
};

const sensors = ["MOD","MYD","VIIRS_SNPP","MOD_MYD_VIIRS_SNPP","SPEXone"];
const statistics = ["absolute","relative"];

const variablesBySensor = {
  MOD:["AOD550","AE550to860"],
  MYD:["AOD550","AE550to860"],
  VIIRS_SNPP:["AOD550","AE550to860"],
  MOD_MYD_VIIRS_SNPP:["AOD550","AE550to860"],
  SPEXone:["AOD550","AE550to860","SSA550"]
};

const variableNames = {
  AOD550:"AOD 550 nm",
  AE550to860:"Ångström Exponent 550–860 nm",
  SSA550:"SSA 550 nm"
};

const aodFilters = {
  AOD550:"0",
  AE550to860:"0.2",
  SSA550:"0"
};

const figureBase = "https://surfdrive.surf.nl/s/rN2HLG7zJi3cqCM/download?path=%2F&files=";
const startMonth = "201812";

const monthFormat = new Intl.DateTimeFormat("en",{month:"long",year:"numeric",timeZone:"UTC"});
let months = [];

const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const monthLabel = month => monthFormat.format(new Date(`${month.slice(0,4)}-${month.slice(4)}-01T00:00:00Z`));
const setOptions = (select,values,label) => { select.replaceChildren(...values.map(value => new Option(label(value),value))); };

function buildMonths(start) {
  const result = [];
  let year = Number(start.slice(0,4));
  let month = Number(start.slice(4,6))-1;
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}${String(month+1).padStart(2,"0")}`);
    month++;
    if (month === 12) { month=0; year++; }
  }
  return result;
}

function monthDates(month) {
  const year = Number(month.slice(0,4));
  const mon = Number(month.slice(4,6));
  const lastDay = new Date(Date.UTC(year,mon,0)).getUTCDate();
  return {start:`${month}01`,end:`${month}${String(lastDay).padStart(2,"0")}`};
}

function figureFilename(month,sensor,statistic,variable) {
  const dates = monthDates(month);
  return `${sensor}_vs_0001_vs_control_${dates.start}-${dates.end}_${statistic}_${variable}_AODfilter${aodFilters[variable]}.png`;
}

function figureUrl(filename) {
  return figureBase + encodeURIComponent(filename);
}

function updateVariableOptions() {
  const sensor = els.sensor.value;
  const current = els.variable.value;
  const variables = variablesBySensor[sensor] || [];
  setOptions(els.variable,variables,value => variableNames[value] || value);
  if (variables.includes(current)) els.variable.value = current;
}

function syncUrl() {
  const params = new URLSearchParams();
  ["month","sensor","statistic","variable"].forEach(key => params.set(key,els[key].value));
  history.replaceState(null,"",`?${params}`);
}

function setMissing(sensor,month,statistic,variable) {
  els.figure.hidden = true;
  els.figure.removeAttribute("src");
  els.figure.alt = "";
  els["open-image"].hidden = true;
  els["open-image"].removeAttribute("href");
  els.empty.hidden = false;
  els.empty.querySelector("h3").textContent = "Figure not available";
  els.empty.querySelector("p").textContent = `${sensorNames[sensor] || sensor} · ${variableNames[variable] || variable} · ${monthLabel(month)} · ${titleCase(statistic)} has not been uploaded yet.`;
  els.stage.setAttribute("aria-busy","false");
}

function render() {
  const month = els.month.value;
  const sensor = els.sensor.value;
  const statistic = els.statistic.value;
  const variable = els.variable.value;
  const index = months.indexOf(month);
  const sensorLabel = sensorNames[sensor] || sensor.replaceAll("_"," ");
  const variableLabel = variableNames[variable] || variable;

  els["figure-title"].textContent = `${sensorLabel} · ${variableLabel}`;
  els["figure-kicker"].textContent = `${monthLabel(month)} · ${titleCase(statistic)} statistics`;
  els.stage.setAttribute("aria-busy","true");
  els.figure.hidden = true;
  els.empty.hidden = true;
  els["open-image"].hidden = true;

  const filename = figureFilename(month,sensor,statistic,variable);
  const url = figureUrl(filename);
  const probe = new Image();

  probe.onload = () => {
    els.figure.src = url;
    els.figure.alt = `${sensorLabel} ${variableLabel} ${statistic} evaluation for ${monthLabel(month)}`;
    els.figure.hidden = false;
    els.empty.hidden = true;
    els["open-image"].href = url;
    els["open-image"].hidden = false;
    els.stage.setAttribute("aria-busy","false");
  };

  probe.onerror = () => setMissing(sensor,month,statistic,variable);
  probe.src = url;

  els.previous.disabled = index <= 0;
  els.next.disabled = index >= months.length-1;
  els["previous-label"].textContent = index > 0 ? monthLabel(months[index-1]) : "No earlier month";
  els["next-label"].textContent = index < months.length-1 ? monthLabel(months[index+1]) : "Latest month";
  els.position.textContent = `${index+1} of ${months.length}`;
  syncUrl();
}

function stepMonth(amount) {
  const index = months.indexOf(els.month.value)+amount;
  if (months[index]) { els.month.value=months[index]; render(); }
}

function init() {
  months = buildMonths(startMonth);

  setOptions(els.month,months,monthLabel);
  setOptions(els.sensor,sensors,value => sensorNames[value] || value.replaceAll("_"," "));
  setOptions(els.statistic,statistics,titleCase);

  const params = new URLSearchParams(location.search);

  ["month","sensor","statistic"].forEach(key => {
    const value = params.get(key);
    if (value && [...els[key].options].some(option => option.value === value)) els[key].value = value;
  });

  updateVariableOptions();

  const variableParam = params.get("variable");
  if (variableParam && [...els.variable.options].some(option => option.value === variableParam)) els.variable.value = variableParam;

  if (!params.has("month")) els.month.value = months.at(-1);

  els["figure-count"].textContent = `${months.length} months · figures loaded on demand`;

  const loader = document.querySelector(".loader");
  if (loader) loader.remove();

  render();
}

els.sensor.addEventListener("change",() => { updateVariableOptions(); render(); });
els.month.addEventListener("change",render);
els.statistic.addEventListener("change",render);
els.variable.addEventListener("change",render);

els.previous.addEventListener("click",() => stepMonth(-1));
els.next.addEventListener("click",() => stepMonth(1));

document.addEventListener("keydown",event => {
  if (event.target.tagName !== "SELECT" && event.key === "ArrowLeft") stepMonth(-1);
  if (event.target.tagName !== "SELECT" && event.key === "ArrowRight") stepMonth(1);
});

const themeToggle = document.getElementById("theme-toggle");

function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeToggle.setAttribute("aria-label",`Switch to ${dark ? "light" : "dark"} mode`);
}

themeToggle.addEventListener("click",() => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("gallery-theme",theme); } catch (error) {}
  updateThemeLabel();
});

updateThemeLabel();

const infoPanel = document.getElementById("info-panel");
const infoOpen = document.getElementById("info-open");
const infoClose = document.getElementById("info-close");
const infoBackdrop = document.getElementById("info-backdrop");

function setInfoPanel(open) {
  infoPanel.classList.toggle("open",open);
  infoPanel.setAttribute("aria-hidden",String(!open));
  infoOpen.setAttribute("aria-expanded",String(open));
  infoBackdrop.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
  if (open) infoClose.focus(); else infoOpen.focus();
}

infoOpen.addEventListener("click",() => setInfoPanel(true));
infoClose.addEventListener("click",() => setInfoPanel(false));
infoBackdrop.addEventListener("click",() => setInfoPanel(false));
document.addEventListener("keydown",event => { if (event.key === "Escape" && infoPanel.classList.contains("open")) setInfoPanel(false); });

init();
