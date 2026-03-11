const FLOW_DATA_PATH = "../data/kc_flow.csv";
const FLOW_MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const FLOW_SOURCE_ID = "flow-lines";
const ORIGIN_SOURCE_ID = "flow-origins";
const DEST_SOURCE_ID = "flow-destinations";
const FLOW_MAPBOX_TOKEN = "pk.eyJ1IjoiYmVubmk2NjYiLCJhIjoiY21tOHo4eTJoMDBxdDJycTF4cmNuMXo2YSJ9.nJJ5_D3dOefc7feityDgDQ";
const FLOW_LOCALE = "en-US";

let flowMap;
let flowRecords = [];
let flowDates = [];
let datesByYear = new Map();

function initFlowPage() {
  const mapContainer = document.getElementById("flow-map");
  const panelContainer = document.getElementById("flow-chart");

  if (!mapContainer || !panelContainer) {
    return;
  }

  mapContainer.innerHTML = "";
  panelContainer.innerHTML = `
    <div class="flow-controls">
      <div class="flow-field">
        <label for="flow-year-select">Year</label>
        <select id="flow-year-select"></select>
      </div>
      <div class="flow-field">
        <label for="flow-date-select">Dataset Time</label>
        <select id="flow-date-select"></select>
      </div>
    </div>
    <div class="flow-summary-grid">
      <div class="flow-stat">
        <span class="flow-summary-label">Connections</span>
        <strong id="flow-count-value">0</strong>
      </div>
      <div class="flow-stat">
        <span class="flow-summary-label">Total Visitors</span>
        <strong id="flow-total-value">0</strong>
      </div>
      <div class="flow-stat">
        <span class="flow-summary-label">Origins</span>
        <strong id="flow-origin-value">0</strong>
      </div>
      <div class="flow-stat">
        <span class="flow-summary-label">Destinations</span>
        <strong id="flow-destination-value">0</strong>
      </div>
    </div>
    <div class="flow-legend">
      <span class="flow-legend-item"><span class="flow-legend-swatch" style="background:#e76f51;"></span>Origin CBG</span>
      <span class="flow-legend-item"><span class="flow-legend-swatch" style="background:#1d4ed8;"></span>Destination</span>
      <span class="flow-legend-item"><span class="flow-legend-swatch" style="background:#2a9d8f;"></span>Flow line</span>
    </div>
    <p id="flow-status" class="flow-status">Loading flow data...</p>
  `;

  if (!window.mapboxgl || !window.d3) {
    document.getElementById("flow-status").textContent = "Map libraries failed to load.";
    return;
  }

  mapboxgl.accessToken = FLOW_MAPBOX_TOKEN;
  flowMap = new mapboxgl.Map({
    container: "flow-map",
    style: FLOW_MAP_STYLE,
    center: [-122.25, 47.48],
    zoom: 8.7
  });
  flowMap.addControl(new mapboxgl.NavigationControl(), "top-right");

  flowMap.on("load", async () => {
    addFlowSourcesAndLayers(flowMap);

    try {
      flowRecords = await loadFlowData();
      buildFlowControls(flowRecords);
      renderSelectedTime();
    } catch (error) {
      console.error(error);
      document.getElementById("flow-status").textContent = "Failed to load kc_flow.csv.";
    }
  });
}

async function loadFlowData() {
  const rows = await d3.csv(FLOW_DATA_PATH, (row) => {
    const originLon = Number.parseFloat(row.origin_longitude);
    const originLat = Number.parseFloat(row.origin_latitude);
    const destLon = Number.parseFloat(row.destination_longitude);
    const destLat = Number.parseFloat(row.destination_latitude);
    const flowValue = Number.parseFloat(row.flow_visitor_count);

    if (![originLon, originLat, destLon, destLat, flowValue].every(Number.isFinite)) {
      return null;
    }

    return {
      originCbg: row.origin_cbg,
      flowVisitorCount: flowValue,
      destinationBrand: row.destination_brand,
      destinationDate: row.destination_date_range_start,
      destinationCity: row.destination_city,
      destinationPoiCbg: row.destination_poi_cbg,
      originCoordinates: [originLon, originLat],
      destinationCoordinates: [destLon, destLat]
    };
  });

  const filtered = rows.filter(Boolean);
  const groupedDates = new Map();

  filtered.forEach((record) => {
    const year = record.destinationDate.slice(0, 4);
    if (!groupedDates.has(year)) {
      groupedDates.set(year, []);
    }
    groupedDates.get(year).push(record.destinationDate);
  });

  datesByYear = new Map(
    [...groupedDates.entries()].map(([year, dates]) => [
      year,
      [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b))
    ])
  );

  flowDates = [...new Set(filtered.map((record) => record.destinationDate))].sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return filtered;
}

function buildFlowControls(records) {
  const yearSelect = document.getElementById("flow-year-select");
  const dateSelect = document.getElementById("flow-date-select");
  const years = [...datesByYear.keys()].sort();
  const preferredDate = chooseDefaultDate(records);
  const preferredYear = preferredDate.slice(0, 4);

  yearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  yearSelect.value = preferredYear;

  updateDateOptions(preferredYear, preferredDate);

  yearSelect.addEventListener("change", () => {
    const nextYear = yearSelect.value;
    const yearDates = datesByYear.get(nextYear) || [];
    updateDateOptions(nextYear, yearDates[yearDates.length - 1]);
    renderSelectedTime();
  });

  dateSelect.addEventListener("change", renderSelectedTime);
}

function chooseDefaultDate(records) {
  const totals = new Map();

  records.forEach((record) => {
    totals.set(
      record.destinationDate,
      (totals.get(record.destinationDate) || 0) + record.flowVisitorCount
    );
  });

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function updateDateOptions(year, selectedDate) {
  const dateSelect = document.getElementById("flow-date-select");
  const availableDates = datesByYear.get(year) || [];

  dateSelect.innerHTML = availableDates
    .map((dateValue) => {
      const label = new Date(dateValue).toLocaleDateString(FLOW_LOCALE, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      return `<option value="${dateValue}">${label}</option>`;
    })
    .join("");

  if (selectedDate && availableDates.includes(selectedDate)) {
    dateSelect.value = selectedDate;
  } else if (availableDates.length > 0) {
    dateSelect.value = availableDates[availableDates.length - 1];
  }
}

function renderSelectedTime() {
  const dateSelect = document.getElementById("flow-date-select");
  const selectedDate = dateSelect.value;
  const rows = flowRecords.filter((record) => record.destinationDate === selectedDate);

  updateMapSources(rows);
  updateSummary(rows, selectedDate);
}

function addFlowSourcesAndLayers(map) {
  map.addSource(FLOW_SOURCE_ID, {
    type: "geojson",
    data: emptyFeatureCollection()
  });
  map.addSource(ORIGIN_SOURCE_ID, {
    type: "geojson",
    data: emptyFeatureCollection()
  });
  map.addSource(DEST_SOURCE_ID, {
    type: "geojson",
    data: emptyFeatureCollection()
  });

  map.addLayer({
    id: "flow-lines-layer",
    type: "line",
    source: FLOW_SOURCE_ID,
    paint: {
      "line-color": "#2a9d8f",
      "line-opacity": [
        "interpolate",
        ["linear"],
        ["get", "flowVisitorCount"],
        0, 0.18,
        500, 0.28,
        2500, 0.45,
        10000, 0.68,
        50000, 0.88
      ],
      "line-width": [
        "interpolate",
        ["exponential", 1.45],
        ["get", "flowVisitorCount"],
        0, 1.2,
        100, 2.5,
        500, 5,
        1500, 8.5,
        5000, 14,
        15000, 22,
        50000, 32,
        150000, 42
      ]
    }
  });

  map.addLayer({
    id: "origin-points-layer",
    type: "circle",
    source: ORIGIN_SOURCE_ID,
    paint: {
      "circle-radius": 4,
      "circle-color": "#e76f51",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1
    }
  });

  map.addLayer({
    id: "destination-points-layer",
    type: "circle",
    source: DEST_SOURCE_ID,
    paint: {
      "circle-radius": 4.8,
      "circle-color": "#1d4ed8",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.2
    }
  });
}

function updateMapSources(rows) {
  const lineFeatures = rows.map((row) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [row.originCoordinates, row.destinationCoordinates]
    },
    properties: {
      flowVisitorCount: row.flowVisitorCount,
      destinationBrand: row.destinationBrand
    }
  }));

  const originMap = new Map();
  const destinationMap = new Map();

  rows.forEach((row) => {
    const originKey = row.originCbg;
    if (!originMap.has(originKey)) {
      originMap.set(originKey, {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: row.originCoordinates
        },
        properties: {
          label: row.originCbg
        }
      });
    }

    const destinationKey = `${row.destinationPoiCbg}|${row.destinationBrand}`;
    if (!destinationMap.has(destinationKey)) {
      destinationMap.set(destinationKey, {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: row.destinationCoordinates
        },
        properties: {
          label: row.destinationBrand
        }
      });
    }
  });

  flowMap.getSource(FLOW_SOURCE_ID).setData({
    type: "FeatureCollection",
    features: lineFeatures
  });
  flowMap.getSource(ORIGIN_SOURCE_ID).setData({
    type: "FeatureCollection",
    features: [...originMap.values()]
  });
  flowMap.getSource(DEST_SOURCE_ID).setData({
    type: "FeatureCollection",
    features: [...destinationMap.values()]
  });

  fitFlowBounds(rows);
}

function fitFlowBounds(rows) {
  if (!rows.length) {
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  rows.forEach((row) => {
    bounds.extend(row.originCoordinates);
    bounds.extend(row.destinationCoordinates);
  });

  flowMap.fitBounds(bounds, {
    padding: 40,
    duration: 600,
    maxZoom: 11.5
  });
}

function updateSummary(rows, selectedDate) {
  const status = document.getElementById("flow-status");
  const totalVisitors = rows.reduce((sum, row) => sum + row.flowVisitorCount, 0);
  const originCount = new Set(rows.map((row) => row.originCbg)).size;
  const destinationCount = new Set(
    rows.map((row) => `${row.destinationPoiCbg}|${row.destinationBrand}`)
  ).size;

  document.getElementById("flow-count-value").textContent = rows.length.toLocaleString(FLOW_LOCALE);
  document.getElementById("flow-total-value").textContent = Math.round(totalVisitors).toLocaleString(FLOW_LOCALE);
  document.getElementById("flow-origin-value").textContent = originCount.toLocaleString(FLOW_LOCALE);
  document.getElementById("flow-destination-value").textContent = destinationCount.toLocaleString(FLOW_LOCALE);

  if (!rows.length) {
    status.textContent = "No valid flows available for the selected date.";
    return;
  }

  status.textContent = `Showing ${rows.length.toLocaleString(FLOW_LOCALE)} flows for ${new Date(selectedDate).toLocaleDateString(FLOW_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric"
  })}.`;
}

function emptyFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: []
  };
}
