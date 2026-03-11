/*
  intensity_chart.js
  ------------------------------------------------------------
  Purpose:
  Build small dashboard charts for the intensity page using
  visit_counts instead of hourly/weekly arrays.

  Features:
  - selected point summary
  - top brands by total visits
  - selected point vs dataset average
*/

window.IntensityChart = (function () {
  let allFeatures = [];
  let currentYear = "all";

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function getBrand(props) {
    return (
      props.brand ||
      props.Brand ||
      props.BRAND ||
      "Unknown"
    );
  }

  function getVisitCounts(props) {
    return safeNumber(
      props.visit_counts ??
      props.VISIT_COUNTS ??
      props.visits ??
      props.VISITS ??
      0
    );
  }

  function getYear(props) {
    return String(
      props.year ??
      props.Year ??
      props.YEAR ??
      "Unknown"
    );
  }

  function getFilteredFeatures() {
    if (currentYear === "all") return allFeatures;
    return allFeatures.filter(
      (f) => getYear(f.properties) === String(currentYear)
    );
  }

  function buildTopBrands(features, topN = 8) {
    const totals = {};

    features.forEach((feature) => {
      const props = feature.properties || {};
      const brand = getBrand(props);
      const visits = getVisitCounts(props);

      totals[brand] = (totals[brand] || 0) + visits;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
  }

  function averageVisits(features) {
    if (!features.length) return 0;
    const total = features.reduce((sum, f) => {
      return sum + getVisitCounts(f.properties || {});
    }, 0);
    return total / features.length;
  }

  function renderEmpty(message = "No data available.") {
    const panel = document.getElementById("intensity-chart");
    if (!panel) return;

    panel.innerHTML = `
      <div class="dashboard-card">
        <h3>Intensity Dashboard</h3>
        <p>${message}</p>
      </div>
    `;
  }

  function renderDashboard(selectedFeature = null) {
    const panel = document.getElementById("intensity-chart");
    if (!panel) return;

    const filtered = getFilteredFeatures();

    if (!filtered.length) {
      renderEmpty("No features available for the current filter.");
      return;
    }

    const avgVisits = averageVisits(filtered);
    const topBrands = buildTopBrands(filtered, 8);

    let selectedHTML = `
      <div class="dashboard-card">
        <h3>Selected Location</h3>
        <p>Click a circle on the map to inspect one location.</p>
      </div>
    `;

    if (selectedFeature) {
      const props = selectedFeature.properties || {};
      const brand = getBrand(props);
      const visits = getVisitCounts(props);
      const year = getYear(props);

      const higherThanPct = avgVisits > 0
        ? ((visits / avgVisits) * 100).toFixed(1)
        : "0.0";

      selectedHTML = `
        <div class="dashboard-card">
          <h3>Selected Location</h3>
          <div class="metric-row"><span>Brand</span><strong>${brand}</strong></div>
          <div class="metric-row"><span>Visit Counts</span><strong>${visits.toLocaleString()}</strong></div>
          <div class="metric-row"><span>Year</span><strong>${year}</strong></div>
          <div class="metric-row"><span>Compared to Avg.</span><strong>${higherThanPct}%</strong></div>
        </div>
      `;
    }

    const maxTopValue = topBrands.length ? topBrands[0][1] : 1;

    const topBrandsHTML = topBrands.map(([brand, value]) => {
      const width = maxTopValue > 0 ? (value / maxTopValue) * 100 : 0;
      return `
        <div class="bar-item">
          <div class="bar-label-row">
            <span class="bar-label">${brand}</span>
            <span class="bar-value">${value.toLocaleString()}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    }).join("");

    const summaryHTML = `
      <div class="dashboard-card">
        <h3>Dataset Summary</h3>
        <div class="metric-row"><span>Visible Locations</span><strong>${filtered.length.toLocaleString()}</strong></div>
        <div class="metric-row"><span>Average Visit Counts</span><strong>${Math.round(avgVisits).toLocaleString()}</strong></div>
        <div class="metric-row"><span>Top Brand Groups</span><strong>${topBrands.length}</strong></div>
      </div>
    `;

    panel.innerHTML = `
      <div class="intensity-dashboard-grid">
        ${selectedHTML}
        ${summaryHTML}
        <div class="dashboard-card dashboard-card-wide">
          <h3>Top Brands by Total Visit Counts</h3>
          ${topBrandsHTML || "<p>No brand totals available.</p>"}
        </div>
      </div>
    `;
  }

  function setData(features) {
    allFeatures = Array.isArray(features) ? features : [];
    renderDashboard();
  }

  function setYearFilter(yearValue) {
    currentYear = yearValue == null ? "all" : String(yearValue);
    renderDashboard();
  }

  function updateSelectedFeature(feature) {
    renderDashboard(feature);
  }

  return {
    setData,
    setYearFilter,
    updateSelectedFeature
  };
})();