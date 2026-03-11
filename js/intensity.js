/*
  intensity.js
  ------------------------------------------------------------------
  Purpose:
  Build the Foot Traffic Intensity page inside the shared template.

  Updates:
  1. Add a large invisible hitbox layer for much easier clicking
  2. Keep visible circles styled separately from clickable area
  3. Highlight the selected point after click
  4. Keep heatmap / points / hitbox filters synced
  5. Connect map clicks to IntensityChart dashboard
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
            Keep points on for easier clicking.
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

  let currentYear = 2024;
  let currentBrandKeyword = "";
  let selectedFeatureId = null;
  let activePopup = null;

  function getBrandValue(props) {
    return props.brand || props.BRAND || "Unknown brand";
  }

  function getLocationValue(props) {
    return props.location_name || props.LOCATION_NAME || "Unknown location";
  }

  function getVisitCountsValue(props) {
    const value = Number(
      props.visit_counts ??
      props.VISIT_COUNTS ??
      props.visits ??
      props.VISITS ??
      0
    );
    return Number.isFinite(value) ? value : 0;
  }

  function getYearValue(props) {
    return props.year ?? props.YEAR ?? "Unknown";
  }

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

        if (window.IntensityChart) {
          window.IntensityChart.setData(data.features);
          window.IntensityChart.setYearFilter(currentYear);
        }

        map.addSource("foot-traffic", {
          type: "geojson",
          data: data
        });

        map.addLayer({
          id: "foot-traffic-heat",
          type: "heatmap",
          source: "foot-traffic",
          maxzoom: 15,
          filter: ["==", ["get", "year"], currentYear],
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "visit_counts"],
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

        map.addLayer({
          id: "foot-traffic-points",
          type: "circle",
          source: "foot-traffic",
          minzoom: 9,
          filter: ["==", ["get", "year"], currentYear],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9, 7,
              14, 11
            ],
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#ff7a00",
              "#ffffff"
            ],
            "circle-stroke-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#8a3c00",
              "#2b7bbb"
            ],
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              3,
              1.4
            ],
            "circle-opacity": 0.9
          }
        });

        map.addLayer({
          id: "foot-traffic-hitbox",
          type: "circle",
          source: "foot-traffic",
          minzoom: 9,
          filter: ["==", ["get", "year"], currentYear],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9, 18,
              14, 28
            ],
            "circle-color": "#000000",
            "circle-opacity": 0
          }
        }, "foot-traffic-points");

        function buildFilterExpression() {
          if (currentBrandKeyword.trim() === "") {
            return ["==", ["get", "year"], currentYear];
          }

          return [
            "all",
            ["==", ["get", "year"], currentYear],
            [
              "in",
              currentBrandKeyword.toLowerCase(),
              ["downcase", ["coalesce", ["get", "brand"], ""]]
            ]
          ];
        }

        function clearSelection() {
          if (selectedFeatureId !== null) {
            map.setFeatureState(
              { source: "foot-traffic", id: selectedFeatureId },
              { selected: false }
            );
            selectedFeatureId = null;
          }
        }

        function applyMapFilters() {
          const filterExpression = buildFilterExpression();

          map.setFilter("foot-traffic-heat", filterExpression);
          map.setFilter("foot-traffic-points", filterExpression);
          map.setFilter("foot-traffic-hitbox", filterExpression);

          clearSelection();

          if (activePopup) {
            activePopup.remove();
            activePopup = null;
          }

          if (window.IntensityChart) {
            window.IntensityChart.setYearFilter(currentYear);
          }

          if (chartBox) {
            const label = currentBrandKeyword === "" ? "All brands" : `Brand filter: ${currentBrandKeyword}`;
            chartBox.innerHTML = `
              <div class="placeholder-content">
                <h3>Intensity Dashboard</h3>
                <p><strong>${label}</strong></p>
                <p>Showing data for <strong>${currentYear}</strong>.</p>
                <p>Click a visible point on the map to explore location details and visit counts.</p>
              </div>
            `;
          }
        }

        function renderFeatureDetails(feature) {
          if (!feature) return;

          const props = feature.properties || {};
          const coords = feature.geometry.coordinates.slice();

          const locationName = getLocationValue(props);
          const brand = getBrandValue(props);
          const visitCounts = getVisitCountsValue(props);
          const year = getYearValue(props);

          clearSelection();
          selectedFeatureId = feature.id;

          map.setFeatureState(
            { source: "foot-traffic", id: selectedFeatureId },
            { selected: true }
          );

          if (activePopup) {
            activePopup.remove();
          }

          map.flyTo({
            center: coords,
            zoom: Math.max(map.getZoom(), 13),
            speed: 0.7,
            essential: true
          });

          const popupHTML = `
            <div>
              <h3 style="margin:0 0 6px 0;">${locationName}</h3>
              <p style="margin:2px 0;"><strong>Brand:</strong> ${brand}</p>
              <p style="margin:2px 0;"><strong>Visit Counts:</strong> ${visitCounts.toLocaleString()}</p>
              <p style="margin:2px 0;"><strong>Year:</strong> ${year}</p>
            </div>
          `;

          activePopup = new mapboxgl.Popup({ offset: 12 })
            .setLngLat(coords)
            .setHTML(popupHTML)
            .addTo(map);

          activePopup.on("close", () => {
            clearSelection();
            activePopup = null;
          });

          if (window.IntensityChart) {
            console.log("Clicked feature:", props);
            console.log("visit_counts:", visitCounts);
            window.IntensityChart.updateSelectedFeature(feature);
          } else {
            console.warn("window.IntensityChart not found. Check intensity_chart.js.");
          }
        }

        yearSlider.addEventListener("input", (e) => {
          currentYear = Number(e.target.value);
          yearValue.textContent = currentYear;
          applyMapFilters();

          if (window.IntensityChart) {
            window.IntensityChart.setYearFilter(currentYear);
          }
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
          const visibility = e.target.checked ? "visible" : "none";
          map.setLayoutProperty("foot-traffic-points", "visibility", visibility);
          map.setLayoutProperty("foot-traffic-hitbox", "visibility", visibility);
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
          map.setLayoutProperty("foot-traffic-hitbox", "visibility", "visible");

          applyMapFilters();
        });

        map.on("click", "foot-traffic-hitbox", (e) => {
          if (!e.features || !e.features.length) return;
          renderFeatureDetails(e.features[0]);
        });

        map.on("mouseenter", "foot-traffic-hitbox", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "foot-traffic-hitbox", () => {
          map.getCanvas().style.cursor = "";
        });

        if (chartBox) {
          chartBox.innerHTML = `
            <div class="placeholder-content">
              <h3>Intensity Dashboard</h3>
              <p>Showing data for <strong>${currentYear}</strong>.</p>
              <p>Use the filter panel above the map to refine the display.</p>
              <p>Click any visible point to open location details and visit-count charts.</p>
            </div>
          `;
        }
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
              <p>The map data could not be loaded, so the dashboard is not ready yet.</p>
            </div>
          `;
        }
      });
  });
}