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
      <h3>Category Map Placeholder</h3>
      <p>This section will later contain Vamika's category / brand visualization.</p>
    `;
  }

  if (chartBox) {
    chartBox.innerHTML = `<span>Category ranking placeholder</span>`;
  }
}