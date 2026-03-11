/*
temporal.js
--------------------------------------------------
Temporal map visualization with monthly time slider
and dashboard statistics.
*/

const TEMPORAL_GEOJSON_PATH = "../data/kc_intensity_wide_joined.geojson";
const TEMPORAL_MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const TEMPORAL_MAPBOX_TOKEN = "pk.eyJ1IjoiYWVsa3VuY2h3YXIiLCJhIjoiY21oZWM5ZnBnMGRxNzJscHV5bmp4eXBidSJ9.lx_hyQVKP_Tj5MqbTnqwIw";

const TEMPORAL_SOURCE_ID = "temporal-data";
const TEMPORAL_LAYER_ID = "temporal-fill";

let temporalMap;
let temporalData;
let timeKeys = [];
let currentTimeIndex = 0;

function initTemporalTemplate() {

  const mapBox = document.getElementById("temporal-map");
  const chartBox = document.getElementById("temporal-chart");

  if (!mapBox || !chartBox) return;

  mapBox.innerHTML = "";
  chartBox.innerHTML = "";

  const mapContainer = document.createElement("div");
  mapContainer.id = "temporal-map-container";
  mapContainer.style.width = "100%";
  mapContainer.style.height = "620px";
  mapContainer.style.borderRadius = "24px";
  mapContainer.style.overflow = "hidden";

  mapBox.appendChild(mapContainer);

  chartBox.innerHTML = `
    <div class="temporal-controls">

      <label>Time Period</label>
      <input type="range" id="temporal-time-slider" min="0" max="0" value="0">
      <div id="temporal-time-display">Loading...</div>

      <div class="temporal-stats">

        <div class="temporal-stat">
          <span>Total Activity</span>
          <strong id="temporal-total">0</strong>
        </div>

        <div class="temporal-stat">
          <span>Average</span>
          <strong id="temporal-avg">0</strong>
        </div>

        <div class="temporal-stat">
          <span>Peak</span>
          <strong id="temporal-peak">0</strong>
        </div>

        <div class="temporal-stat">
          <span>Active Areas</span>
          <strong id="temporal-active">0</strong>
        </div>

      </div>
    </div>
  `;

  initTemporalMap();
}

async function initTemporalMap() {

  mapboxgl.accessToken = TEMPORAL_MAPBOX_TOKEN;

  temporalMap = new mapboxgl.Map({
    container: "temporal-map-container",
    style: TEMPORAL_MAP_STYLE,
    center: [-122.25, 47.48],
    zoom: 8.7
  });

  temporalMap.addControl(new mapboxgl.NavigationControl(), "top-right");

  temporalMap.on("load", async () => {

    const response = await fetch(TEMPORAL_GEOJSON_PATH);
    temporalData = await response.json();

    /* Convert string numbers → numeric */
    temporalData.features.forEach(f => {

      Object.keys(f.properties).forEach(k => {

        if (k.startsWith("dc_") && f.properties[k] !== null) {
          f.properties[k] = +f.properties[k];
        }

      });

    });

    /* Extract monthly keys */

    timeKeys = Object.keys(temporalData.features[0].properties)
      .filter(k => k.startsWith("dc_"))
      .sort((a,b)=>{

        const [_,y1,m1] = a.split("_").map(Number);
        const [__,y2,m2] = b.split("_").map(Number);

        return y1 === y2 ? m1 - m2 : y1 - y2;

      });

    const slider = document.getElementById("temporal-time-slider");
    slider.max = timeKeys.length - 1;

    slider.addEventListener("input", e => {

      currentTimeIndex = +e.target.value;
      updateTemporalVisualization();

    });

    addTemporalLayer();
    updateTemporalVisualization();

  });

}

function addTemporalLayer() {

  temporalMap.addSource(TEMPORAL_SOURCE_ID,{
    type:"geojson",
    data: temporalData
  });

  temporalMap.addLayer({
    id:TEMPORAL_LAYER_ID,
    type:"fill",
    source:TEMPORAL_SOURCE_ID,

    paint:{
      "fill-color":[
        "interpolate",
        ["linear"],
        ["get", timeKeys[0]],

        0,"#f7fbff",
        1000,"#deebf7",
        3000,"#c6dbef",
        5000,"#9ecae1",
        7000,"#6baed6",
        10000,"#4292c6",
        15000,"#2171b5",
        20000,"#08519c"
      ],

      "fill-opacity":0.7,
      "fill-outline-color":"#ffffff"
    }
  });

  temporalMap.on("click", TEMPORAL_LAYER_ID, e => {

    const props = e.features[0].properties;
    const key = timeKeys[currentTimeIndex];
    const value = props[key] || 0;

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <b>${props.NAMELSAD00 || "Area"}</b><br>
        Activity: ${value.toLocaleString()}<br>
        <small>${formatTimeKey(key)}</small>
      `)
      .addTo(temporalMap);

  });

}

function updateTemporalVisualization(){

  if(!temporalMap) return;

  const key = timeKeys[currentTimeIndex];

  temporalMap.setPaintProperty(
    TEMPORAL_LAYER_ID,
    "fill-color",
    [
      "interpolate",
      ["linear"],
      ["get", key],

      0,"#f7fbff",
      1000,"#deebf7",
      3000,"#c6dbef",
      5000,"#9ecae1",
      7000,"#6baed6",
      10000,"#4292c6",
      15000,"#2171b5",
      20000,"#08519c"
    ]
  );

  document.getElementById("temporal-time-display")
    .textContent = formatTimeKey(key);

  updateStats();

}

function updateStats(){

  const key = timeKeys[currentTimeIndex];

  const values = temporalData.features
    .map(f=>f.properties[key])
    .filter(v=>v!==null && !isNaN(v));

  const total = values.reduce((a,b)=>a+b,0);
  const avg = total/values.length;
  const max = Math.max(...values);
  const active = values.filter(v=>v>0).length;

  document.getElementById("temporal-total").textContent = total.toLocaleString();
  document.getElementById("temporal-avg").textContent = Math.round(avg).toLocaleString();
  document.getElementById("temporal-peak").textContent = max.toLocaleString();
  document.getElementById("temporal-active").textContent = active.toLocaleString();

}

function formatTimeKey(key){

  const parts = key.split("_");
  const year = parts[1];
  const month = parts[2];

  const months=[
    "January","February","March","April",
    "May","June","July","August",
    "September","October","November","December"
  ];

  return `${months[+month-1]} ${year}`;

}
