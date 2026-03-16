/*
  intensity.js
  ------------------------------------------------------------------
  Purpose:
  Build the Foot Traffic Intensity page inside the shared template.

  Updated behavior:
  1. Remove click interaction for individual points
  2. Keep heatmap / point display only for visual reference
  3. Keep only the ranking dashboard
  4. Merge former intensity_chart.js logic into this file
  5. Update ranking dynamically when filters change
*/

function initIntensityTemplate() {
  const mapBox = document.getElementById("intensity-map");
  const chartBox = document.getElementById("intensity-chart");

  if (!mapBox) {
    console.error("Map container #intensity-map was not found.");
    return;
  }

  mapBox.innerHTML = "";

  if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded.");
    mapBox.innerHTML = `
      <div class="placeholder-content">
        <h3>Map failed to load</h3>
        <p>Mapbox GL JS was not found. Please check the script and CSS links in intensity.html.</p>
      </div>
    `;
    return;
  }

  mapboxgl.accessToken = "pk.eyJ1IjoiYmVubmk2NjYiLCJhIjoiY21tOHo4eTJoMDBxdDJycTF4cmNuMXo2YSJ9.nJJ5_D3dOefc7feityDgDQ";

  /*
    ---------------------------------------------------------
    Create the interactive filter control panel above the map
    ---------------------------------------------------------
  */
  const controlWrap = document.createElement("div");
  controlWrap.className = "intensity-control-wrap";
  controlWrap.style.marginBottom = "14px";
  controlWrap.innerHTML = `
    <div style="
      display:grid;
      gap:14px;
      background:rgba(17, 31, 58, 0.9);
      border:1px solid rgba(135, 185, 255, 0.15);
      border-radius:14px;
      padding:14px 16px;
      color:#dbe7ff;
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#8fe7dd;">
            Interactive Filter Panel
          </div>
          <div style="font-size:18px; font-weight:700; margin-top:4px;">
            Foot Traffic Controls
          </div>
        </div>
        <button
          id="reset-filters-btn"
          style="
            background:#213657;
            color:#ffffff;
            border:none;
            border-radius:999px;
            padding:8px 14px;
            cursor:pointer;
            font-weight:600;
          "
        >
          Reset Filters
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        <div>
          <label for="year-slider" style="display:block; font-weight:600; margin-bottom:8px;">
            Year: <span id="year-value">2024</span>
          </label>
          <input
            id="year-slider"
            type="range"
            min="2024"
            max="2026"
            step="1"
            value="2024"
            style="width:100%;"
          />
          <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.85; margin-top:4px;">
            <span>2024</span>
            <span>2025</span>
            <span>2026</span>
          </div>
        </div>

        <div>
          <label for="brand-filter" style="display:block; font-weight:600; margin-bottom:8px;">
            Brand keyword
          </label>
          <input
            id="brand-filter"
            type="text"
            placeholder="e.g. Starbucks, Safeway"
            style="
              width:100%;
              padding:10px 12px;
              border-radius:10px;
              border:1px solid rgba(255,255,255,0.15);
              background:#122545;
              color:#ffffff;
              outline:none;
              box-sizing:border-box;
            "
          />
          <div style="font-size:12px; opacity:0.8; margin-top:6px;">
            Leave blank to show all brands.
          </div>
        </div>

        <div>
          <div style="font-weight:600; margin-bottom:8px;">Map layers</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="toggle-heatmap" checked />
              <span>Heatmap</span>
            </label>

            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="toggle-points" checked />
              <span>Points</span>
            </label>
          </div>
          <div style="font-size:12px; opacity:0.8; margin-top:6px;">
            Points are shown only as visual reference.
          </div>
        </div>
      </div>

      <div style="
        display:grid;
        gap:8px;
        border-top:1px solid rgba(255,255,255,0.08);
        padding-top:12px;
      ">
        <div style="font-weight:600;">Heatmap Legend</div>
        <div style="
          height:14px;
          border-radius:999px;
          background:linear-gradient(
            to right,
            rgba(33,102,172,0),
            rgb(103,169,207),
            rgb(209,229,240),
            rgb(253,219,199),
            rgb(239,138,98),
            rgb(178,24,43)
          );
          border:1px solid rgba(255,255,255,0.12);
        "></div>
        <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.85;">
          <span>Lower intensity</span>
          <span>Higher intensity</span>
        </div>
      </div>
    </div>
  `;

  mapBox.parentNode.prepend(controlWrap);

  const yearSlider = document.getElementById("year-slider");
  const yearValue = document.getElementById("year-value");
  const brandFilterInput = document.getElementById("brand-filter");
  const toggleHeatmap = document.getElementById("toggle-heatmap");
  const togglePoints = document.getElementById("toggle-points");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");

  const map = new mapboxgl.Map({
    container: "intensity-map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-122.335167, 47.608013],
    zoom: 10.8
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  /*
    Current filter state
  */
  let currentYear = 2024;
  let currentBrandKeyword = "";
  let allFeatures = [];

  /*
    ---------------------------------------------------------
    Helper functions
  */
  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function getBrandValue(props) {
    return (
      props.brand ||
      props.Brand ||
      props.BRAND ||
      "Unknown brand"
    );
  }

  function getVisitCountsValue(props) {
    return safeNumber(
      props.visit_counts ??
      props.VISIT_COUNTS ??
      props.visits ??
      props.VISITS ??
      0
    );
  }

  function getYearValue(props) {
    return String(
      props.year ??
      props.Year ??
      props.YEAR ??
      "Unknown"
    );
  }

  /*
    ---------------------------------------------------------
    Dashboard logic merged from intensity_chart.js
    Only keep ranking section
  */
  function getFilteredFeaturesForDashboard() {
    return allFeatures.filter((feature) => {
      const props = feature.properties || {};
      const yearMatch = getYearValue(props) === String(currentYear);

      const brand = getBrandValue(props).toLowerCase();
      const keyword = currentBrandKeyword.trim().toLowerCase();
      const brandMatch = keyword === "" || brand.includes(keyword);

      return yearMatch && brandMatch;
    });
  }

  function buildTopBrands(features, topN = 8) {
    const totals = {};

    features.forEach((feature) => {
      const props = feature.properties || {};
      const brand = getBrandValue(props);
      const visits = getVisitCountsValue(props);

      totals[brand] = (totals[brand] || 0) + visits;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
  }

  function renderRankingDashboard() {
    if (!chartBox) return;

    const filtered = getFilteredFeaturesForDashboard();

    if (!filtered.length) {
      chartBox.innerHTML = `
        <div class="dashboard-card">
          <h3>Top Brands Ranking</h3>
          <p>No features available for the current filter.</p>
        </div>
      `;
      return;
    }

    const topBrands = buildTopBrands(filtered, 10);
    const maxTopValue = topBrands.length ? topBrands[0][1] : 1;

    const topBrandsHTML = topBrands.map(([brand, value], index) => {
      const width = maxTopValue > 0 ? (value / maxTopValue) * 100 : 0;

      return `
        <div class="bar-item">
          <div class="bar-label-row">
            <span class="bar-label">#${index + 1} ${brand}</span>
            <span class="bar-value">${value.toLocaleString()}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    }).join("");

    const filterLabel = currentBrandKeyword.trim() === ""
      ? "All brands"
      : `Brand filter: ${currentBrandKeyword}`;

    chartBox.innerHTML = `
      <div class="dashboard-card dashboard-card-wide">
        <h3>Top Brands by Total Visit Counts</h3>
        <p style="margin-top:0; opacity:0.85;">
          Year: <strong>${currentYear}</strong> · ${filterLabel}
        </p>
        ${topBrandsHTML || "<p>No brand totals available.</p>"}
      </div>
    `;
  }

  /*
    Build map filter expression
  */
  function buildFilterExpression() {
    if (currentBrandKeyword.trim() === "") {
      return [
        "any",
        ["==", ["to-string", ["coalesce", ["get", "year"], ["get", "YEAR"], ""]], String(currentYear)],
        ["==", ["to-string", ["coalesce", ["get", "Year"], ["get", "YEAR"], ["get", "year"], ""]], String(currentYear)]
      ];
    }

    const keyword = currentBrandKeyword.toLowerCase();

    return [
      "all",
      [
        "any",
        ["==", ["to-string", ["coalesce", ["get", "year"], ["get", "YEAR"], ""]], String(currentYear)],
        ["==", ["to-string", ["coalesce", ["get", "Year"], ["get", "YEAR"], ["get", "year"], ""]], String(currentYear)]
      ],
      [
        "any",
        ["in", keyword, ["downcase", ["coalesce", ["get", "brand"], ""]]],
        ["in", keyword, ["downcase", ["coalesce", ["get", "Brand"], ""]]],
        ["in", keyword, ["downcase", ["coalesce", ["get", "BRAND"], ""]]]
      ]
    ];
  }

  function applyMapFilters() {
    const filterExpression = buildFilterExpression();

    map.setFilter("foot-traffic-heat", filterExpression);
    map.setFilter("foot-traffic-points", filterExpression);

    renderRankingDashboard();
  }

  /*
    ---------------------------------------------------------
    Load data after map is ready
  */
  map.on("load", () => {
    fetch("../data/seattle_agg_2024_2026_full_clean.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GeoJSON request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("GeoJSON loaded successfully:", data.features.length, "features");

        data.features.forEach((feature, index) => {
          if (feature.id === undefined || feature.id === null) {
            feature.id = index;
          }
        });

        allFeatures = Array.isArray(data.features) ? data.features : [];
        renderRankingDashboard();

        map.addSource("foot-traffic", {
          type: "geojson",
          data: data
        });

        /*
          Heatmap layer
        */
        map.addLayer({
          id: "foot-traffic-heat",
          type: "heatmap",
          source: "foot-traffic",
          maxzoom: 15,
          filter: buildFilterExpression(),
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "visit_counts"], ["get", "VISIT_COUNTS"], 0],
              0, 0,
              50000, 1
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9, 1,
              15, 3
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(33,102,172,0)",
              0.2, "rgb(103,169,207)",
              0.4, "rgb(209,229,240)",
              0.6, "rgb(253,219,199)",
              0.8, "rgb(239,138,98)",
              1, "rgb(178,24,43)"
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9, 6,
              15, 22
            ],
            "heatmap-opacity": 0.9
          }
        });

        /*
          Point layer only for visual reference
        */
        map.addLayer({
          id: "foot-traffic-points",
          type: "circle",
          source: "foot-traffic",
          minzoom: 9,
          filter: buildFilterExpression(),
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9, 7,
              14, 11
            ],
            "circle-color": "#ffffff",
            "circle-stroke-color": "#2b7bbb",
            "circle-stroke-width": 1.4,
            "circle-opacity": 0.9
          }
        });

        /*
          -----------------------------------------------------
          UI interactions
        */
        yearSlider.addEventListener("input", (e) => {
          currentYear = Number(e.target.value);
          yearValue.textContent = currentYear;
          applyMapFilters();
        });

        brandFilterInput.addEventListener("input", (e) => {
          currentBrandKeyword = e.target.value.trim();
          applyMapFilters();
        });

        toggleHeatmap.addEventListener("change", (e) => {
          map.setLayoutProperty(
            "foot-traffic-heat",
            "visibility",
            e.target.checked ? "visible" : "none"
          );
        });

        togglePoints.addEventListener("change", (e) => {
          map.setLayoutProperty(
            "foot-traffic-points",
            "visibility",
            e.target.checked ? "visible" : "none"
          );
        });

        resetFiltersBtn.addEventListener("click", () => {
          currentYear = 2024;
          currentBrandKeyword = "";

          yearSlider.value = "2024";
          yearValue.textContent = "2024";
          brandFilterInput.value = "";
          toggleHeatmap.checked = true;
          togglePoints.checked = true;

          map.setLayoutProperty("foot-traffic-heat", "visibility", "visible");
          map.setLayoutProperty("foot-traffic-points", "visibility", "visible");

          applyMapFilters();
        });
      })
      .catch((error) => {
        console.error("Failed to load GeoJSON:", error);

        mapBox.innerHTML = `
          <div class="placeholder-content">
            <h3>Data failed to load</h3>
            <p>Please check the GeoJSON path and file structure.</p>
          </div>
        `;

        if (chartBox) {
          chartBox.innerHTML = `
            <div class="placeholder-content">
              <h3>Dashboard unavailable</h3>
              <p>The map data could not be loaded, so the ranking panel is not ready yet.</p>
            </div>
          `;
        }
      });
  });
}