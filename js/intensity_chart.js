/*
  intensity_chart.js
  ------------------------------------------------------------------
  Purpose:
  Render the dashboard charts for the intensity page.

  This script will:
  1. Safely parse visits_by_day and visits_by_each_hour
  2. Build a weekly bar chart
  3. Build an hourly line chart
  4. Update the dashboard panel whenever a map point is clicked
*/

// Keep chart instances globally so we can destroy old charts
let weeklyChartInstance = null;
let hourlyChartInstance = null;

/*
  Helper function:
  GeoJSON properties may sometimes arrive as arrays,
  and sometimes as JSON strings.
  This function safely converts them into normal JS arrays.
*/
function parseArrayField(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Could not parse array field:", value);
      return [];
    }
  }

  return [];
}

/*
  Main function:
  Called by intensity.js after the user clicks a map point.
*/
function updateIntensityCharts(props, chartBox) {
  if (!chartBox) return;

  const weeklyData = parseArrayField(props.visits_by_day);
  const hourlyData = parseArrayField(props.visits_by_each_hour);

  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hourlyLabels = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
    "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"
  ];

  // Replace the dashboard content with info + 2 canvas elements
  chartBox.innerHTML = `
    <div class="intensity-panel">
      <h3>${props.location_name || "Unknown location"}</h3>
      <p><strong>Brand:</strong> ${props.brand || "N/A"}</p>
      <p><strong>Address:</strong> ${props.street_address || "N/A"}</p>
      <p><strong>City:</strong> ${props.city || "N/A"}</p>
      <p><strong>Visits:</strong> ${Number(props.visit_counts).toLocaleString()}</p>
      <p><strong>Year:</strong> ${props.year}</p>

      <div style="margin-top:20px;">
        <h4 style="margin-bottom:10px;">Weekly Pattern</h4>
        <canvas id="weekly-bar-chart"></canvas>
      </div>

      <div style="margin-top:24px;">
        <h4 style="margin-bottom:10px;">Hourly Pattern</h4>
        <canvas id="hourly-line-chart"></canvas>
      </div>
    </div>
  `;

  const weeklyCanvas = document.getElementById("weekly-bar-chart");
  const hourlyCanvas = document.getElementById("hourly-line-chart");

  // Destroy previous charts before drawing new ones
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }

  if (hourlyChartInstance) {
    hourlyChartInstance.destroy();
  }

  // -------------------------------
  // Weekly bar chart
  // -------------------------------
  weeklyChartInstance = new Chart(weeklyCanvas, {
    type: "bar",
    data: {
      labels: weeklyLabels,
      datasets: [
        {
          label: "Visits by Day",
          data: weeklyData,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Visits"
          }
        },
        x: {
          title: {
            display: true,
            text: "Day of Week"
          }
        }
      }
    }
  });

  // -------------------------------
  // Hourly line chart
  // -------------------------------
  hourlyChartInstance = new Chart(hourlyCanvas, {
    type: "line",
    data: {
      labels: hourlyLabels,
      datasets: [
        {
          label: "Visits by Hour",
          data: hourlyData,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Visits"
          }
        },
        x: {
          title: {
            display: true,
            text: "Hour of Day"
          }
        }
      }
    }
  });
}