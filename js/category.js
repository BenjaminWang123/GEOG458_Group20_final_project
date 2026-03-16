/*
  category.js
  ------------------------------------------------------------------
  Purpose:
  Turn the old category page into a proportional circle map page.

  Layout behavior:
  - Use the shared page structure created by main.js
  - Move interactive controls into the top-right toolbar area
  - Let the map container hold only the map
  - Keep the side panel for summary/dashboard information
*/

function initCategoryTemplate() {
  const mapBox = document.getElementById("category-map");
  const chartBox = document.getElementById("category-chart");

  if (!mapBox || !chartBox) return;

  /*
    ------------------------------------------------------------
    1. Use the shared toolbar area created in main.js
    ------------------------------------------------------------
  */
  const mapStage = mapBox.closest(".map-stage");
  const toolbar = mapStage ? mapStage.querySelector(".fake-toolbar") : null;

  if (toolbar) {
    toolbar.innerHTML = `
      <div
        style="
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          align-items:center;
          justify-content:flex-end;
        "
      >
        <select
          id="brand-select"
          style="
            min-width:170px;
            padding:10px 12px;
            border-radius:999px;
            border:1px solid rgba(255,255,255,0.12);
            background:rgba(255,255,255,0.06);
            color:#ffffff;
            outline:none;
          "
        >
          <option value="all">All brands</option>
        </select>

        <input
          id="brand-search"
          type="text"
          placeholder="Search brand..."
          style="
            min-width:190px;
            padding:10px 14px;
            border-radius:999px;
            border:1px solid rgba(255,255,255,0.12);
            background:rgba(255,255,255,0.06);
            color:#ffffff;
            outline:none;
          "
        />

        <button
          id="reset-circle-filters"
          style="
            padding:10px 14px;
            border-radius:999px;
            border:none;
            background:#213657;
            color:#ffffff;
            cursor:pointer;
            font-weight:600;
          "
        >
          Reset
        </button>
      </div>
    `;
  }

  /*
    ------------------------------------------------------------
    2. Make the map container hold only the actual map
    ------------------------------------------------------------
  */
  mapBox.innerHTML = `<div id="real-category-map"></div>`;

  mapBox.style.padding = "0";
  mapBox.style.minHeight = "680px";
  mapBox.style.height = "680px";
  mapBox.style.overflow = "hidden";

  const realMap = document.getElementById("real-category-map");
  realMap.style.width = "100%";
  realMap.style.height = "100%";
  realMap.style.minHeight = "680px";
  realMap.style.borderRadius = "20px";
  realMap.style.overflow = "hidden";

  const brandSelect = document.getElementById("brand-select");
  const brandSearch = document.getElementById("brand-search");
  const resetBtn = document.getElementById("reset-circle-filters");

  mapboxgl.accessToken = "pk.eyJ1IjoiYmVubmk2NjYiLCJhIjoiY21tOHo4eTJoMDBxdDJycTF4cmNuMXo2YSJ9.nJJ5_D3dOefc7feityDgDQ";

  const map = new mapboxgl.Map({
    container: "real-category-map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [-122.33, 47.61],
    zoom: 9
  });

  map.addControl(new mapboxgl.NavigationControl());

  fetch("../data/seattle_agg_2024_2026_full_clean.geojson")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then((geojson) => {
      const features = (geojson.features || []).filter((f, i) => {
        if (!f.geometry || f.geometry.type !== "Point") return false;

        if (f.id === undefined || f.id === null) {
          f.id = i;
        }

        return true;
      });

      const data = {
        type: "FeatureCollection",
        features
      };

      let currentBrand = "all";
      let currentBrandKeyword = "";

      function getBrand(props) {
        return props.brand || props.Brand || props.BRAND || "Unknown";
      }

      function getCategory(props) {
        return (
          props.category ||
          props.top_category ||
          props.destination_top_category ||
          props.CATEGORY ||
          "Other"
        );
      }

      function getVisits(props) {
        const v = Number(
          props.visit_counts ??
          props.VISIT_COUNTS ??
          props.visits ??
          props.VISITS ??
          0
        );
        return Number.isFinite(v) ? v : 0;
      }

      function getYear(props) {
        return String(
          props.year ??
          props.Year ??
          props.YEAR ??
          "Unknown"
        );
      }

      function getLocationName(props) {
        return props.location_name || props.LOCATION_NAME || getBrand(props);
      }

      function populateFilters() {
        const brands = [...new Set(features.map((f) => getBrand(f.properties || {})))].sort();

        brands.forEach((brand) => {
          const option = document.createElement("option");
          option.value = brand;
          option.textContent = brand;
          brandSelect.appendChild(option);
        });
      }

      function buildFilterExpression() {
        const filterParts = ["all"];

        if (currentBrand !== "all") {
          filterParts.push([
            "any",
            ["==", ["coalesce", ["get", "brand"], ""], currentBrand],
            ["==", ["coalesce", ["get", "Brand"], ""], currentBrand],
            ["==", ["coalesce", ["get", "BRAND"], ""], currentBrand]
          ]);
        }

        if (currentBrandKeyword.trim() !== "") {
          const keyword = currentBrandKeyword.toLowerCase();

          filterParts.push([
            "any",
            ["in", keyword, ["downcase", ["coalesce", ["get", "brand"], ""]]],
            ["in", keyword, ["downcase", ["coalesce", ["get", "Brand"], ""]]],
            ["in", keyword, ["downcase", ["coalesce", ["get", "BRAND"], ""]]]
          ]);
        }

        return filterParts.length === 1 ? null : filterParts;
      }

      function getFilteredFeatures() {
        return features.filter((f) => {
          const props = f.properties || {};
          const brand = getBrand(props).toLowerCase();

          const brandSelectMatch =
            currentBrand === "all" || getBrand(props) === currentBrand;

          const brandSearchMatch =
            currentBrandKeyword.trim() === "" ||
            brand.includes(currentBrandKeyword.toLowerCase());

          return brandSelectMatch && brandSearchMatch;
        });
      }

      function buildDashboard(selectedFeature = null) {
        const filteredFeatures = getFilteredFeatures();
        const totalLocations = filteredFeatures.length;

        const totalVisits = filteredFeatures.reduce((sum, f) => {
          return sum + getVisits(f.properties || {});
        }, 0);

        const avgVisits = totalLocations ? Math.round(totalVisits / totalLocations) : 0;

        const topLocations = [...filteredFeatures]
          .sort((a, b) => getVisits(b.properties || {}) - getVisits(a.properties || {}))
          .slice(0, 8);

        let selectedHTML = `
          <div class="dashboard-card">
            <h3>Selected Location</h3>
            <p>Click a circle on the map to inspect location details.</p>
          </div>
        `;

        if (selectedFeature) {
          const props = selectedFeature.properties || {};
          selectedHTML = `
            <div class="dashboard-card">
              <h3>Selected Location</h3>
              <div class="metric-row"><span>Name</span><strong>${getLocationName(props)}</strong></div>
              <div class="metric-row"><span>Brand</span><strong>${getBrand(props)}</strong></div>
              <div class="metric-row"><span>Category</span><strong>${getCategory(props)}</strong></div>
              <div class="metric-row"><span>Visit Counts</span><strong>${getVisits(props).toLocaleString()}</strong></div>
              <div class="metric-row"><span>Year</span><strong>${getYear(props)}</strong></div>
            </div>
          `;
        }

        const summaryHTML = `
          <div class="dashboard-card">
            <h3>Dataset Summary</h3>
            <div class="metric-row"><span>Visible Locations</span><strong>${totalLocations.toLocaleString()}</strong></div>
            <div class="metric-row"><span>Total Visits</span><strong>${totalVisits.toLocaleString()}</strong></div>
            <div class="metric-row"><span>Average Visits</span><strong>${avgVisits.toLocaleString()}</strong></div>
            <div class="metric-row"><span>Brand Filter</span><strong>${currentBrand === "all" ? "All" : currentBrand}</strong></div>
            <div class="metric-row"><span>Brand Search</span><strong>${currentBrandKeyword.trim() === "" ? "None" : currentBrandKeyword}</strong></div>
          </div>
        `;

        const topHTML = topLocations.map((f) => {
          const props = f.properties || {};
          return `
            <div class="bar-item">
              <div class="bar-label-row">
                <span class="bar-label">${getLocationName(props)}</span>
                <span class="bar-value">${getVisits(props).toLocaleString()}</span>
              </div>
            </div>
          `;
        }).join("");

        chartBox.innerHTML = `
          <div class="intensity-dashboard-grid">
            ${selectedHTML}
            ${summaryHTML}
            <div class="dashboard-card dashboard-card-wide">
              <h3>Top Locations by Visit Counts</h3>
              ${topHTML || "<p>No data available.</p>"}
            </div>
          </div>
        `;
      }

      function fitToFilteredData() {
        const filteredFeatures = getFilteredFeatures();
        if (!filteredFeatures.length) return;

        const bounds = new mapboxgl.LngLatBounds();
        filteredFeatures.forEach((f) => {
          bounds.extend(f.geometry.coordinates);
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 40,
            maxZoom: 12
          });
        }
      }

      function applyFilters() {
        const expression = buildFilterExpression();

        if (expression) {
          map.setFilter("proportional-circles", expression);
        } else {
          map.setFilter("proportional-circles", null);
        }

        map.setFilter("selected-circle", ["==", ["id"], -1]);

        buildDashboard();
        fitToFilteredData();

        setTimeout(() => map.resize(), 80);
      }

      function addLegend() {
        const legend = document.createElement("div");
        legend.className = "mapboxgl-ctrl";
        legend.style.background = "rgba(17, 31, 58, 0.92)";
        legend.style.color = "#dbe7ff";
        legend.style.padding = "12px 14px";
        legend.style.borderRadius = "14px";
        legend.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
        legend.style.minWidth = "200px";

        legend.innerHTML = `
          <div style="font-weight:700; margin-bottom:8px;">Proportional Circle Legend</div>
          <div style="font-size:12px; opacity:0.9; margin-bottom:10px;">
            Circle size = visit counts
          </div>

          <div style="display:grid; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:10px; height:10px; border-radius:50%; background:#34d399; border:1px solid #fff;"></div>
              <span style="font-size:12px;">Low visits</span>
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:18px; height:18px; border-radius:50%; background:#34d399; border:1px solid #fff;"></div>
              <span style="font-size:12px;">Medium visits</span>
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:28px; height:28px; border-radius:50%; background:#34d399; border:1px solid #fff;"></div>
              <span style="font-size:12px;">High visits</span>
            </div>

            <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
              <div style="width:10px; height:10px; border-radius:50%; background:#f59e0b; border:1px solid #fff;"></div>
              <span style="font-size:12px;">Selected location</span>
            </div>
          </div>
        `;

        class LegendControl {
          onAdd() {
            return legend;
          }
          onRemove() {
            legend.parentNode.removeChild(legend);
          }
        }

        map.addControl(new LegendControl(), "bottom-left");
      }

      function renderMap() {
        map.addSource("proportional-points", {
          type: "geojson",
          data
        });

        map.addLayer({
          id: "proportional-circles",
          type: "circle",
          source: "proportional-points",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "visit_counts"], ["get", "VISIT_COUNTS"], 0],
              0, 4,
              1000, 7,
              5000, 11,
              10000, 15,
              25000, 22,
              50000, 30
            ],
            "circle-color": "#34d399",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.2,
            "circle-opacity": 0.78
          }
        });

        map.addLayer({
          id: "selected-circle",
          type: "circle",
          source: "proportional-points",
          filter: ["==", ["id"], -1],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "visit_counts"], ["get", "VISIT_COUNTS"], 0],
              0, 6,
              1000, 9,
              5000, 13,
              10000, 17,
              25000, 24,
              50000, 32
            ],
            "circle-color": "#f59e0b",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": 0.95
          }
        });

        map.on("click", "proportional-circles", (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;

          const props = feature.properties || {};
          const coords = feature.geometry.coordinates.slice();

          map.setFilter("selected-circle", ["==", ["id"], feature.id]);

          new mapboxgl.Popup({ className: "dark-popup", offset: 12 })
            .setLngLat(coords)
            .setHTML(`
              <strong>${getLocationName(props)}</strong><br>
              Brand: ${getBrand(props)}<br>
              Category: ${getCategory(props)}<br>
              Visit Counts: ${getVisits(props).toLocaleString()}<br>
              Year: ${getYear(props)}
            `)
            .addTo(map);

          buildDashboard(feature);
        });

        map.on("mouseenter", "proportional-circles", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "proportional-circles", () => {
          map.getCanvas().style.cursor = "";
        });

        brandSelect.addEventListener("change", (e) => {
          currentBrand = e.target.value;
          applyFilters();
        });

        brandSearch.addEventListener("input", (e) => {
          currentBrandKeyword = e.target.value.trim();
          applyFilters();
        });

        resetBtn.addEventListener("click", () => {
          currentBrand = "all";
          currentBrandKeyword = "";

          brandSelect.value = "all";
          brandSearch.value = "";

          applyFilters();
        });

        populateFilters();
        addLegend();
        buildDashboard();
        fitToFilteredData();

        setTimeout(() => map.resize(), 120);
      }

      if (map.loaded()) {
        renderMap();
      } else {
        map.once("load", renderMap);
      }

      window.addEventListener("resize", () => {
        map.resize();
      });
    })
    .catch((error) => {
      console.error(error);

      mapBox.innerHTML = `
        <div class="placeholder-content">
          <h3>Map failed to load</h3>
          <p>Please check your GeoJSON path and data fields.</p>
        </div>
      `;

      chartBox.innerHTML = `
        <div class="placeholder-content">
          <h3>Dashboard unavailable</h3>
          <p>The proportional circle dataset could not be loaded.</p>
        </div>
      `;
    });
}