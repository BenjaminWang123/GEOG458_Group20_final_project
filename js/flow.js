/*
  flow_map.js
  ------------------------------------------------------------------
  Purpose:
  Placeholder file for the visitor flow page.

  Future use:
  - load flow GeoJSON data
  - draw origin-destination lines or paths
  - add flow filters and legend
  - connect small dashboard summaries

  Right now:
  - only updates the placeholder text so teammates know
    this file is connected correctly
*/

function initFlowTemplate() {
  const mapBox = document.getElementById("flow-map");
  const chartBox = document.getElementById("flow-chart");

  if (mapBox) {
    const placeholder = mapBox.querySelector(".placeholder-content");
    if (placeholder) {
      placeholder.innerHTML = `
        <h3>Flow Map Placeholder</h3>
        <p>This section will later contain Yuanfan's visitor flow visualization.</p>
      `;
    }
  }

  if (chartBox) {
    chartBox.innerHTML = `<span>Flow summary widget placeholder</span>`;
  }
}