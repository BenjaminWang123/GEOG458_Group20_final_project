function initCategoryTemplate() {
  const mapBox = document.getElementById("category-map");
  const chartBox = document.getElementById("category-chart");
  if (!mapBox || !chartBox) return;

  // 1. Initialize Container
  mapBox.innerHTML = `<div id="real-category-map" style="width:100%; height:100%; min-height:520px; border-radius:20px;"></div>`;

  mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN"; // Replace with your actual token

  const map = new mapboxgl.Map({
    container: "real-category-map",
    style: "mapbox://styles/mapbox/dark-v11", // Dark style matches your UI better
    center: [-122.33, 47.61],
    zoom: 9
  });

  map.addControl(new mapboxgl.NavigationControl());

  // 2. Load and Parse Data
  Papa.parse("../data/kc_flow.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const raw = results.data;

      // Clean and Format Data
      const data = raw.map(d => ({
        brand: (d.destination_brand || "Unknown").trim(),
        category: (d.destination_top_category || "Other").trim(),
        lon: Number(d.destination_long),
        lat: Number(d.destination_latitude),
        visits: Number(d.flow_visits || 0)
      })).filter(d => !isNaN(d.lon) && !isNaN(d.lat));

      // Generate GeoJSON Features
      const features = data.map(d => ({
        type: "Feature",
        properties: {
          brand: d.brand,
          category: d.category,
          visits: d.visits
        },
        geometry: {
          type: "Point",
          coordinates: [d.lon, d.lat]
        }
      }));

      function render() {
        // 3. Add Data Source & Layer to Map
        if (!map.getSource("points")) {
          map.addSource("points", {
            type: "geojson",
            data: { type: "FeatureCollection", features }
          });

          map.addLayer({
            id: "points-layer",
            type: "circle",
            source: "points",
            paint: {
              "circle-radius": [
                "interpolate", ["linear"], ["zoom"],
                9, 3,
                14, 8
              ],
              "circle-color": "#3b82f6",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.8
            }
          });

          // Click Popup Logic
          map.on("click", "points-layer", e => {
            const p = e.features[0].properties;
            new mapboxgl.Popup({ className: 'dark-popup' })
              .setLngLat(e.features[0].geometry.coordinates)
              .setHTML(`<strong>${p.brand}</strong><br>${p.category}<br>Visits: ${p.visits}`)
              .addTo(map);
          });
        }

        // 4. Build Dashboard UI
        chartBox.innerHTML = `
          <div style="height:100%; overflow-y:auto; color: white; padding: 10px;">
            <h3 style="margin-top:0; color: #60a5fa;">Category Explorer</h3>
            <p style="font-size: 0.9em; opacity: 0.8;">Select a category to filter the map:</p>
            <div id="category-buttons" style="margin-bottom:20px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
            <div id="category-results">
               <p style="font-style: italic; color: #94a3b8;">Click a category to see top brands.</p>
            </div>
          </div>
        `;

        const buttonsContainer = document.getElementById("category-buttons");
        const resultsContainer = document.getElementById("category-results");

        // Helper to Style Buttons
        function styleButton(btn) {
          btn.style.padding = "6px 12px";
          btn.style.borderRadius = "20px";
          btn.style.border = "1px solid #3b82f6";
          btn.style.background = "transparent";
          btn.style.color = "#60a5fa";
          btn.style.fontSize = "12px";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s";
          
          btn.onmouseover = () => { btn.style.background = "rgba(59, 130, 246, 0.1)"; };
          btn.onmouseout = () => { if(btn.dataset.active !== "true") btn.style.background = "transparent"; };
        }

        // Get unique categories from data
        const categories = [...new Set(data.map(d => d.category))].sort();

        // Add "Show All" Button
        const allBtn = document.createElement("button");
        allBtn.textContent = "All Categories";
        styleButton(allBtn);
        allBtn.onclick = () => {
          map.setFilter("points-layer", null);
          resultsContainer.innerHTML = `<p>Showing all ${data.length} locations.</p>`;
        };
        buttonsContainer.appendChild(allBtn);

        // Add Category Buttons
        categories.forEach(cat => {
          const btn = document.createElement("button");
          btn.textContent = cat;
          styleButton(btn);
          
          btn.onclick = () => {
            // Filter Map
            map.setFilter("points-layer", ["==", ["get", "category"], cat]);

            // Zoom Map to selection
            const filtered = data.filter(d => d.category === cat);
            if (filtered.length > 0) {
              const bounds = new mapboxgl.LngLatBounds();
              filtered.forEach(p => bounds.extend([p.lon, p.lat]));
              map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
            }

            // Update Brand List in Sidebar
            const topBrands = [...new Set(filtered.map(d => d.brand))].slice(0, 15);
            resultsContainer.innerHTML = `
              <h4 style="margin-bottom:10px; color: #fbbf24;">${cat}</h4>
              <ul style="padding-left: 0; list-style: none;">
                ${topBrands.map(b => `<li style="padding: 5px 0; border-bottom: 1px solid #1e293b;">${b}</li>`).join("")}
              </ul>
            `;
          };
          buttonsContainer.appendChild(btn);
        });
      }

      if (map.loaded()) render();
      else map.once("load", render);
    }
  });
}
