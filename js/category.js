/*
  category_map.js
  ------------------------------------------------------------------
  Purpose:
  Placeholder file for the category page.

  Future use:
  - visualize business categories or brands
  - add ranking chart or category filter
  - connect the small dashboard panel

  Right now:
  - only updates the template placeholder text
*/

function initCategoryTemplate() {
  const mapBox = document.getElementById("category-map");
  const chartBox = document.getElementById("category-chart");

  if (mapBox) {
    mapBox.querySelector(".placeholder-content").innerHTML = `
      <h3>Restaurant Category Overview</h3>
      <p>This section will visualize restaurant categories using foot traffic data.</p>

      <ul>
        <li><strong>Breakfast</strong> locations</li>
        <li><strong>Lunch</strong> locations</li>
        <li><strong>Dinner</strong> locations</li>
        <li><strong>Take Out & Delivery Only</strong> locations</li>
      </ul>

      <p>These categories will later be displayed on the map using filters.</p>
    `;
  }

  if (chartBox) {
    chartBox.innerHTML = `
      <h3>Category Ranking</h3>
      <p>A bar chart will show the number of locations for each category.</p>

      <ul>
        <li>Breakfast</li>
        <li>Lunch</li>
        <li>Dinner</li>
        <li>Take Out & Delivery Only</li>
      </ul>
    `;
  }
}


