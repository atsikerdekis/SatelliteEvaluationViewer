const els = Object.fromEntries(["month","sensor","statistic","variable","figure","empty","stage","figure-title","figure-kicker","open-image","previous","next","previous-label","next-label","position","figure-count"].map(id => [id, document.getElementById(id)]));
const sensorNames = { MOD:"MODIS Terra", MYD:"MODIS Aqua", VIIRS_SNPP:"VIIRS SNPP", MOD_MYD_VIIRS_SNPP:"All satellites" };
const monthFormat = new Intl.DateTimeFormat("en", { month:"long", year:"numeric", timeZone:"UTC" });
const figureBase = "https://surfdrive.surf.nl/s/b6MQcZaAEjkeqsj/download?path=%2F&files=";
let figures = [], months = [];

const unique = key => [...new Set(figures.map(item => item[key]))].sort();
const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const monthLabel = month => monthFormat.format(new Date(`${month.slice(0,4)}-${month.slice(4)}-01T00:00:00Z`));
const setOptions = (select, values, label) => { select.replaceChildren(...values.map(value => new Option(label(value), value))); };
const figureUrl = file => figureBase + encodeURIComponent(file.replace(/^figures\//, ""));

function syncUrl() {
  const params = new URLSearchParams();
  ["month","sensor","statistic","variable"].forEach(key => params.set(key, els[key].value));
  history.replaceState(null, "", `?${params}`);
}

function render() {
  const selection = Object.fromEntries(["month","sensor","statistic","variable"].map(key => [key, els[key].value]));
  const item = figures.find(row => Object.entries(selection).every(([key,value]) => row[key] === value));
  const index = months.indexOf(selection.month);
  const sensor = sensorNames[selection.sensor] || selection.sensor.replaceAll("_", " ");
  els["figure-title"].textContent = `${sensor} · ${selection.variable}`;
  els["figure-kicker"].textContent = `${monthLabel(selection.month)} · ${titleCase(selection.statistic)} statistics`;
  els.figure.hidden = !item; els.empty.hidden = !!item; els["open-image"].hidden = !item;

  if (item) {
    const url = figureUrl(item.file);
    els.figure.src = url;
    els.figure.alt = `${sensor} ${selection.variable} ${selection.statistic} evaluation for ${monthLabel(selection.month)}`;
    els["open-image"].href = url;
  } else {
    els.figure.removeAttribute("src");
    els.figure.alt = "";
    els["open-image"].removeAttribute("href");
  }

  els.stage.setAttribute("aria-busy", "false");
  els.previous.disabled = index <= 0; els.next.disabled = index >= months.length - 1;
  els["previous-label"].textContent = index > 0 ? monthLabel(months[index-1]) : "No earlier month";
  els["next-label"].textContent = index < months.length-1 ? monthLabel(months[index+1]) : "Latest month";
  els.position.textContent = `${index + 1} of ${months.length}`;
  syncUrl();
}

function stepMonth(amount) {
  const index = months.indexOf(els.month.value) + amount;
  if (months[index]) { els.month.value = months[index]; render(); }
}

async function init() {
  try {
    const response = await fetch("figures.json", { cache:"no-store" });
    if (!response.ok) throw new Error("Manifest unavailable");
    figures = await response.json();
    if (!figures.length) throw new Error("No matching figures");
    months = unique("month");
    setOptions(els.month, months, monthLabel);
    setOptions(els.sensor, unique("sensor"), value => sensorNames[value] || value.replaceAll("_", " "));
    setOptions(els.statistic, unique("statistic"), titleCase);
    setOptions(els.variable, unique("variable"), value => value);

    const params = new URLSearchParams(location.search);
    ["month","sensor","statistic","variable"].forEach(key => {
      const value = params.get(key);
      if ([...els[key].options].some(option => option.value === value)) els[key].value = value;
    });

    if (!params.has("month")) els.month.value = months.at(-1);
    els["figure-count"].textContent = `${figures.length} figures · ${months.length} months`;
    document.querySelector(".loader").remove();
    render();
  } catch (error) {
    document.querySelector(".loader").remove();
    els.empty.hidden = false;
    els.empty.querySelector("h3").textContent = "Figures could not be loaded";
    els.empty.querySelector("p").textContent = "Update figures.json, then reload this page.";
    els.stage.setAttribute("aria-busy", "false");
  }
}

document.getElementById("filters").addEventListener("change", render);
els.previous.addEventListener("click", () => stepMonth(-1)); els.next.addEventListener("click", () => stepMonth(1));
document.addEventListener("keydown", event => { if (event.target.tagName !== "SELECT" && event.key === "ArrowLeft") stepMonth(-1); if (event.target.tagName !== "SELECT" && event.key === "ArrowRight") stepMonth(1); });

const themeToggle = document.getElementById("theme-toggle");
function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
}
themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("gallery-theme", theme); } catch (error) {}
  updateThemeLabel();
});
updateThemeLabel();

const infoPanel = document.getElementById("info-panel");
const infoOpen = document.getElementById("info-open");
const infoClose = document.getElementById("info-close");
const infoBackdrop = document.getElementById("info-backdrop");
function setInfoPanel(open) {
  infoPanel.classList.toggle("open", open);
  infoPanel.setAttribute("aria-hidden", String(!open));
  infoOpen.setAttribute("aria-expanded", String(open));
  infoBackdrop.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
  if (open) infoClose.focus(); else infoOpen.focus();
}
infoOpen.addEventListener("click", () => setInfoPanel(true));
infoClose.addEventListener("click", () => setInfoPanel(false));
infoBackdrop.addEventListener("click", () => setInfoPanel(false));
document.addEventListener("keydown", event => { if (event.key === "Escape" && infoPanel.classList.contains("open")) setInfoPanel(false); });

init();
