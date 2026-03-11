function initCategoryTemplate() {
  mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN";

  const categories = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Take Out and Delivery Only"
  ];

  const chartBox = document.getElementById("category-chart");

  const map = new mapboxgl.Map({
    container: "category-map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-122.25, 47.65],
    zoom: 4
  });

  map.addControl(new mapboxgl.NavigationControl());

  fetch("../data/monthly-patterns-foot-traffic-sample.csv")
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split("\n");
      const headers = rows[0].split("\t");

      const brandIndex = headers.indexOf("brands");
      const tagsIndex = headers.indexOf("category_tags");
      const latIndex = headers.indexOf("latitude");
      const lonIndex = headers.indexOf("longitude");
      const visitsIndex = headers.indexOf("raw_visit_counts");

      const features = rows.slice(1).map(row => {
        const cols = row.split("\t");

        return {
          type: "Feature",
          properties: {
            brand: cols[brandIndex],
            tags: cols[tagsIndex],
            visits: Number(cols[visitsIndex] || 0)
          },
          geometry: {
            type: "Point",
            coordinates: [
              Number(cols[lonIndex]),
              Number(cols[latIndex])
            ]
          }
        };
      }).filter(feature =>
        !isNaN(feature.geometry.coordinates[0]) &&
        !isNaN(feature.geometry.coordinates[1])
      );

      map.on("load", () => {
        map.addSource("restaurants", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: features
          }
        });

        map.addLayer({
          id: "restaurant-points",
          type: "circle",
          source: "restaurants",
          paint: {
            "circle-radius": 5,
            "circle-color": "#ff6b00",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff"
          }
        });

        map.on("click", "restaurant-points", e => {
          const props = e.features[0].properties;

          new mapboxgl.Popup()
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`
              <strong>${props.brand}</strong><br>
              Tags: ${props.tags}<br>
              Visits: ${props.visits}
            `)
            .addTo(map);
        });

        map.on("mouseenter", "restaurant-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "restaurant-points", () => {
          map.getCanvas().style.cursor = "";
        });

        renderButtons(features);
        renderChart(features);
      });

      function renderButtons(allFeatures) {
        const mapContainer = document.getElementById("category-map");

        const controls = document.createElement("div");
        controls.style.position = "absolute";
        controls.style.top = "10px";
        controls.style.left = "10px";
        controls.style.zIndex = "2";
        controls.style.background = "white";
        controls.style.padding = "10px";
        controls.style.borderRadius = "8px";
        controls.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";

        const allBtn = document.createElement("button");
        allBtn.textContent = "All";
        allBtn.style.marginRight = "6px";
        allBtn.onclick = () => {
          map.getSource("restaurants").setData({
            type: "FeatureCollection",
            features: allFeatures
          });
        };
        controls.appendChild(allBtn);

        categories.forEach(category => {
          const btn = document.createElement("button");
          btn.textContent = category;
          btn.style.marginRight = "6px";
          btn.style.marginTop = "6px";

          btn.onclick = () => {
            const filtered = allFeatures.filter(f =>
              f.properties.tags && f.properties.tags.includes(category)
            );

            map.getSource("restaurants").setData({
              type: "FeatureCollection",
              features: filtered
            });
          };

          controls.appendChild(btn);
        });

        mapContainer.appendChild(controls);
      }

      function renderChart(allFeatures) {
        const counts = categories.map(category =>
          allFeatures.filter(f => f.properties.tags && f.properties.tags.includes(category)).length
        );

        chartBox.innerHTML = `
          <h3>Category Counts</h3>
          <canvas id="categoryBarChart"></canvas>
        `;

        const ctx = document.getElementById("categoryBarChart").getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: categories,
            datasets: [{
              label: "Number of Locations",
              data: counts
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    });
}
