
/* =========================================================
   GEOG458 — Intensity Dashboard Starter (Wide GeoJSON)
   - Uses joined data: geometry + dc_YYYY_MM columns
   - Mapbox basemap
   - Choropleth updates by switching which dc_ column is used
   - Click polygon => C3 timeseries
========================================================= */

// ===== 1) CONFIG =====

// Path to your joined GeoJSON (relative to index.html)
const GEOJSON_PATH = "./data/kc_intensity_wide_joined.geojson";

// Map style (you can change to other Mapbox styles)
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

// Layer/source names (Mapbox needs stable IDs)
const SOURCE_ID = "kcIntensitySource";
const FILL_LAYER_ID = "kcIntensityFill";
const LINE_LAYER_ID = "kcIntensityOutline";
const HIGHLIGHT_LAYER_ID = "kcHighlight";

// We’ll color based on a chosen column, like "dc_2019_01"
let currentColumn = null;

// Keep a list of all dc_YYYY_MM columns found in the file
let timeColumns = [];     // e.g. ["dc_2019_01", "dc_2019_02", ...]
let timeLabels = [];      // e.g. ["2019-01", "2019-02", ...]

// Selected feature info
let selectedId = null;    // the block group ID
let selectedProps = null;

// Animation
let timer = null;


// ===== 2) DOM ELEMENTS (right panel) =====
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const timeSlider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeLabel");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const layerToggle = document.getElementById("layerToggle");
const selectedBox = document.getElementById("selectedBox");
const legendDiv = document.getElementById("legend");


// ===== 3) MAP INIT =====
const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN"
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: "map",
  style: MAP_STYLE,
  center: [-122.33, 47.61], // Seattle-ish
  zoom: 8.8
});

map.addControl(new mapboxgl.NavigationControl(), "top-right");


// ===== 4) LOAD DATA + BUILD UI =====
(async function init() {
  const geojson = await fetchGeoJSON(GEOJSON_PATH);

  // Identify time columns from properties: dc_YYYY_MM
  // We only need to inspect the first feature's properties to find all columns.
  const sampleProps = geojson.features[0].properties;
  timeColumns = Object.keys(sampleProps)
    .filter(k => k.startsWith("dc_"))
    .sort(); // string sort works because we use dc_YYYY_MM with zero-padded MM

  timeLabels = timeColumns.map(col => col.replace("dc_", "").replace("_", "-")); // "2019_01" -> "2019-01"

  // Set default time to the first available column
  currentColumn = timeColumns[0];

  // Build dropdowns + slider based on available times
  buildTimeControls(timeLabels);

  // Initialize legend (you can adjust breaks later)
  renderLegend();

  // When map is ready, add source + layers
  map.on("load", () => {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: geojson
    });

    // A cleaner look: use fill + light outline (not heavy black edges)
    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": makeColorExpression(currentColumn),
        "fill-opacity": 0.75
      }
    });

    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-width": 0.3,
        "line-opacity": 0.7
      }
    });

    // Highlight layer: only the selected polygon gets a strong outline
    map.addLayer({
      id: HIGHLIGHT_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      filter: ["==", ["get", "BKGPIDFP00"], ""], // no selection initially
      paint: {
        "line-color": "#000000",
        "line-width": 2
      }
    });

    // Fit bounds to data once (optional)
    fitToGeoJSON(geojson);

    // Map interactions
    setupMapInteractions();
  });
})();


// ===== 5) FETCH HELPERS =====
async function fetchGeoJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load GeoJSON: ${path} (${res.status})`);
  }
  return await res.json();
}


// ===== 6) BUILD TIME CONTROLS =====
function buildTimeControls(labels) {
  // Extract years and months from "YYYY-MM"
  const years = Array.from(new Set(labels.map(t => t.split("-")[0]))).sort();
  const months = Array.from(new Set(labels.map(t => t.split("-")[1]))).sort();

  // Populate Year dropdown
  yearSelect.innerHTML = "";
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  // Populate Month dropdown
  monthSelect.innerHTML = "";
  months.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  // Slider for all time steps
  timeSlider.min = 0;
  timeSlider.max = labels.length - 1;
  timeSlider.value = 0;
  timeLabel.textContent = labels[0];

  // Default dropdown selection based on first label
  const [defaultYear, defaultMonth] = labels[0].split("-");
  yearSelect.value = defaultYear;
  monthSelect.value = defaultMonth;

  // When year/month changes, set the slider to that matching time (first match)
  yearSelect.addEventListener("change", () => {
    jumpToYearMonth(yearSelect.value, monthSelect.value);
  });

  monthSelect.addEventListener("change", () => {
    jumpToYearMonth(yearSelect.value, monthSelect.value);
  });

  // Slider change updates the map
  timeSlider.addEventListener("input", () => {
    const idx = Number(timeSlider.value);
    updateTimeByIndex(idx);
  });

  // Play / Pause animation
  playBtn.addEventListener("click", () => startAnimation());
  pauseBtn.addEventListener("click", () => stopAnimation());

  // Toggle layer visibility
  layerToggle.addEventListener("change", () => {
    const visible = layerToggle.checked ? "visible" : "none";
    if (map.getLayer(FILL_LAYER_ID)) map.setLayoutProperty(FILL_LAYER_ID, "visibility", visible);
    if (map.getLayer(LINE_LAYER_ID)) map.setLayoutProperty(LINE_LAYER_ID, "visibility", visible);
  });
}

function jumpToYearMonth(year, month) {
  const target = `${year}-${month}`;
  const idx = timeLabels.indexOf(target);
  if (idx !== -1) {
    timeSlider.value = idx;
    updateTimeByIndex(idx);
  } else {
    // If this month/year doesn't exist, just do nothing (or show a message)
    console.log("No data for:", target);
  }
}

function updateTimeByIndex(idx) {
  const label = timeLabels[idx];
  timeLabel.textContent = label;

  // Keep dropdowns synced with slider
  const [y, m] = label.split("-");
  yearSelect.value = y;
  monthSelect.value = m;

  // Update current column used by choropleth
  currentColumn = timeColumns[idx];

  // Update map paint expression
  if (map.getLayer(FILL_LAYER_ID)) {
    map.setPaintProperty(FILL_LAYER_ID, "fill-color", makeColorExpression(currentColumn));
  }

  // If something is selected, update the “value at selected time”
  if (selectedProps) {
    updateSelectedBox(selectedProps);
  }
}


// ===== 7) COLOR EXPRESSION (choropleth) =====
// This expression runs inside Mapbox, so it must be Mapbox expression syntax.
function makeColorExpression(colName) {
  // If value is null, paint it light gray
  // Then interpolate numeric values into a color scale
  return [
    "case",
    ["==", ["get", colName], null], "#f0f0f0",
    ["interpolate", ["linear"], ["to-number", ["get", colName]],
      0,      "#f2f0f7",
      5000,   "#dadaeb",
      15000,  "#bcbddc",
      30000,  "#9e9ac8",
      60000,  "#756bb1",
      120000, "#54278f"
    ]
  ];
}

function renderLegend() {
  // Simple legend that matches our expression breaks
  const breaks = [
    { label: "No data", color: "#f0f0f0" },
    { label: "0", color: "#f2f0f7" },
    { label: "5k", color: "#dadaeb" },
    { label: "15k", color: "#bcbddc" },
    { label: "30k", color: "#9e9ac8" },
    { label: "60k", color: "#756bb1" },
    { label: "120k+", color: "#54278f" }
  ];

  legendDiv.innerHTML = "";
  breaks.forEach(b => {
    const row = document.createElement("div");
    row.className = "legend-row";

    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = b.color;

    const txt = document.createElement("div");
    txt.className = "small";
    txt.textContent = b.label;

    row.appendChild(swatch);
    row.appendChild(txt);
    legendDiv.appendChild(row);
  });
}


// ===== 8) MAP INTERACTIONS =====
function setupMapInteractions() {
  // Cursor feedback
  map.on("mouseenter", FILL_LAYER_ID, () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", FILL_LAYER_ID, () => (map.getCanvas().style.cursor = ""));

  // Click to select a polygon
  map.on("click", FILL_LAYER_ID, (e) => {
    const feature = e.features[0];
    const props = feature.properties;

    // In your GeoJSON, the stable ID is BKGPIDFP00 (CBG GEOID)
    const geoid = props.BKGPIDFP00;

    selectedId = geoid;
    selectedProps = props;

    // Update highlight layer filter
    map.setFilter(HIGHLIGHT_LAYER_ID, ["==", ["get", "BKGPIDFP00"], geoid]);

    // Update the right panel info
    updateSelectedBox(props);

    // Build timeseries chart for this CBG
    renderC3Chart(props);
  });
}

function updateSelectedBox(props) {
  const geoid = props.BKGPIDFP00;
  const valueAtTime = props[currentColumn]; // dc_YYYY_MM value
  const prettyValue = (valueAtTime === null || valueAtTime === undefined)
    ? "No data"
    : d3.format(",")(Number(valueAtTime));

  selectedBox.innerHTML = `
    <div class="small muted">Selected CBG GEOID:</div>
    <div style="font-size:18px; font-weight:700; margin-bottom:8px;">${geoid}</div>
    <div class="small muted">Value at selected time (${timeLabel.textContent}):</div>
    <div style="font-size:16px; font-weight:700;">${prettyValue}</div>
  `;
}


// ===== 9) C3 CHART =====
let chart = null;

function renderC3Chart(props) {
  // Convert wide columns -> arrays for C3
  // C3 needs columns format: [ ["x", ...], ["DEVICE_COUNTS", ...] ]
  const x = ["x"];
  const y = ["DEVICE_COUNTS"];

  for (let i = 0; i < timeColumns.length; i++) {
    const col = timeColumns[i];
    const label = timeLabels[i]; // "YYYY-MM"

    x.push(label);

    const v = props[col];
    // C3 likes null if missing
    y.push(v === null || v === undefined ? null : Number(v));
  }

  // If chart exists, load new data, else create it
  if (chart) {
    chart.load({ columns: [x, y] });
    return;
  }

  chart = c3.generate({
    bindto: "#chart",
    data: {
      x: "x",
      columns: [x, y],
      type: "line"
    },
    axis: {
      x: {
        type: "category",
        tick: {
          rotate: 60,
          multiline: false,
          // Show fewer ticks so it doesn’t become unreadable
          culling: { max: 10 }
        }
      },
      y: {
        tick: {
          format: d3.format(",")
        }
      }
    },
    point: {
      show: false
    },
    legend: {
      show: false
    }
  });
}


// ===== 10) FIT MAP TO DATA (optional) =====
function fitToGeoJSON(geojson) {
  const bounds = new mapboxgl.LngLatBounds();
  geojson.features.forEach(f => {
    const geom = f.geometry;
    if (!geom) return;

    // Handle MultiPolygon / Polygon
    const coords = (geom.type === "Polygon") ? [geom.coordinates] : geom.coordinates;
    coords.forEach(poly => {
      poly.forEach(ring => {
        ring.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      });
    });
  });

  map.fitBounds(bounds, { padding: 30, duration: 800 });
}


// ===== 11) ANIMATION =====
function startAnimation() {
  if (timer) return; // already playing

  playBtn.disabled = true;
  pauseBtn.disabled = false;

  timer = setInterval(() => {
    let idx = Number(timeSlider.value);
    idx = (idx + 1) % timeLabels.length; // loop
    timeSlider.value = idx;
    updateTimeByIndex(idx);
  }, 900); // speed: ms per step (adjust if needed)
}

function stopAnimation() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  playBtn.disabled = false;
  pauseBtn.disabled = true;
}
