/*
  intensity_map.js
  ------------------------------------------------------------------
  Purpose:
  Placeholder file for the intensity page.

  Future use:
  - load intensity GeoJSON
  - initialize map library
  - add legend / filters
  - connect chart panel

  Right now:
  - only adds a small label to show this JS file is connected correctly
*/

function initIntensityTemplate() {
  const mapBox = document.getElementById("intensity-map");
  const chartBox = document.getElementById("intensity-chart");

  if (mapBox) {
    mapBox.querySelector(".placeholder-content").innerHTML = `
      <h3>Intensity Map Placeholder</h3>
      <p>This section will later contain Benni's heatmap / intensity visualization.</p>
    `;
  }

  if (chartBox) {
    chartBox.innerHTML = `<span>Intensity summary widget placeholder</span>`;
  }
}