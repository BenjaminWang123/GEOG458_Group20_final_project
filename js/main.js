/*
  main.js
  ------------------------------------------------------------------
  Purpose:
  This file stores the shared layout functions used by all pages.

  Why this file matters:
  - Keeps HTML files short and clean
  - Ensures all pages have the same style and structure
  - Makes teamwork easier because shared layout is controlled in one file

  Main functions:
  - renderHomePage(targetId)
  - renderMapPage(targetId, config)
*/

function getBasePath() {
  /*
    Detect whether the current page is in the root folder
    or inside /pages, then return the correct relative path.
  */
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

function buildNavbar(currentPage = "home") {
  /*
    Creates the top navigation bar.
    currentPage controls which link gets the active style.
  */
  const base = getBasePath();

  return `
    <header class="site-header">
      <div class="container nav-wrapper">
        <div class="brand">
          <span class="brand-badge">GEOG458</span>
          <span class="brand-text">Group20 Final Project</span>
        </div>

        <nav class="main-nav">
          <a href="${base}index.html" class="nav-link ${currentPage === "home" ? "active" : ""}">Home</a>
          <a href="${base}pages/intensity.html" class="nav-link ${currentPage === "intensity" ? "active" : ""}">Intensity</a>
          <a href="${base}pages/temporal.html" class="nav-link ${currentPage === "temporal" ? "active" : ""}">Temporal</a>
          <a href="${base}pages/category.html" class="nav-link ${currentPage === "category" ? "active" : ""}">Category</a>
          <a href="${base}pages/flow.html" class="nav-link ${currentPage === "flow" ? "active" : ""}">Flow</a>
        </nav>
      </div>
    </header>
  `;
}

function buildFooter() {
  /*
    Shared footer displayed on all pages.
  */
  return `
    <footer class="site-footer">
      <div class="container footer-content">
        <p>GEOG458 Group20 Final Project</p>
        <p>Template only · maps will be added later</p>
      </div>
    </footer>
  `;
}

function renderHomePage(targetId) {
  /*
    Renders the homepage:
    - intro section
    - project motivation
    - data references
    - four page cards
  */
  const root = document.getElementById(targetId);

  root.innerHTML = `
    ${buildNavbar("home")}

    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-text">
            <p class="eyebrow">Commercial Geography · Spatial Analysis · Urban Mobility</p>
            <h1>Commercial Foot Traffic Dashboard</h1>
            <p class="hero-description">
              This project explores how people move through commercial space using spatial,
              temporal, and categorical patterns of foot traffic data.
            </p>

            <div class="hero-actions">
              <a href="#overview" class="btn btn-primary">Project Overview</a>
              <a href="#pages" class="btn btn-secondary">Explore Pages</a>
            </div>
          </div>

          <div class="hero-panel glass-card">
            <p class="mini-label">Website Structure</p>
            <div class="stat-grid">
              <div class="stat-card">
                <h3>1</h3>
                <p>Main Dashboard</p>
              </div>
              <div class="stat-card">
                <h3>4</h3>
                <p>Map Pages</p>
              </div>
              <div class="stat-card">
                <h3>JS</h3>
                <p>Shared Layout</p>
              </div>
              <div class="stat-card">
                <h3>Data</h3>
                <p>Ready to Connect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" class="section">
        <div class="container two-column">
          <div>
            <p class="section-tag">01 · Project Motivation</p>
            <h2>Why do this project?</h2>
          </div>
          <div>
            <p>
              Commercial areas are shaped by where people go, when they go there, and what kinds
              of places attract them. This project helps reveal patterns of urban activity through
              multiple map views.
            </p>
            <p>
              The website is designed as a multi-page story dashboard so each theme can be shown
              clearly while maintaining a consistent visual language.
            </p>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-tag">02 · Data & References</p>
          <h2>Data sources</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>POI Locations</h3>
              <p>Commercial place locations and site-based information.</p>
            </div>
            <div class="glass-card source-card">
              <h3>Foot Traffic</h3>
              <p>Visitation or activity intensity data for commercial places.</p>
            </div>
            <div class="glass-card source-card">
              <h3>Temporal Patterns</h3>
              <p>Time-based variation such as daily, weekly, or monthly changes.</p>
            </div>
            <div class="glass-card source-card">
              <h3>Brand Info</h3>
              <p>Business categories, brand types, and commercial classifications.</p>
            </div>
            <div class="glass-card source-card">
              <h3>Flows</h3>
              <p>Movement relationships between origins and destinations.</p>
            </div>
            <div class="glass-card source-card">
              <h3>References</h3>
              <p>Add final dataset citation and project references here.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pages" class="section">
        <div class="container">
          <p class="section-tag">03 · Explore Pages</p>
          <h2>Project pages</h2>

          <div class="page-card-grid">
            <a href="pages/intensity.html" class="page-card">
              <span class="page-number">01</span>
              <h3>Foot Traffic Intensity</h3>
              <p>Show hotspots and concentration of commercial activity.</p>
            </a>

            <a href="pages/temporal.html" class="page-card">
              <span class="page-number">02</span>
              <h3>Temporal Patterns</h3>
              <p>Compare how activity changes through time.</p>
            </a>

            <a href="pages/category.html" class="page-card">
              <span class="page-number">03</span>
              <h3>Brand & Category</h3>
              <p>Explore the distribution of commercial types.</p>
            </a>

            <a href="pages/flow.html" class="page-card">
              <span class="page-number">04</span>
              <h3>Visitor Flows</h3>
              <p>Reveal mobility and destination relationships.</p>
            </a>
          </div>
        </div>
      </section>
    </main>

    ${buildFooter()}
  `;
}

function renderMapPage(targetId, config) {
  /*
    Renders a shared layout for all 4 map pages.

    config fields:
    - currentPage
    - pageNumber
    - title
    - subtitle
    - description
    - insights (array)
    - toolbar (array)
    - mapId
    - panelTitle
    - chartId
  */
  const root = document.getElementById(targetId);

  const insightsHTML = config.insights
    .map(item => `<li>${item}</li>`)
    .join("");

  const toolbarHTML = config.toolbar
    .map(item => `<span class="tool-pill">${item}</span>`)
    .join("");

  root.innerHTML = `
    ${buildNavbar(config.currentPage)}

    <main class="page-shell">
      <section class="page-hero compact">
        <div class="container">
          <p class="section-tag">Page ${config.pageNumber}</p>
          <h1>${config.title}</h1>
          <p class="page-subtitle">${config.subtitle}</p>
        </div>
      </section>

      <section class="container dashboard-layout">
        <div class="map-stage glass-card">
          <div class="map-stage-top">
            <div>
              <p class="mini-label">Main Map Area</p>
              <h2>${config.title}</h2>
            </div>
            <div class="fake-toolbar">
              ${toolbarHTML}
            </div>
          </div>

          <div id="${config.mapId}" class="map-placeholder-large">
            <div class="placeholder-content">
              <h3>Map Placeholder</h3>
              <p>This area is reserved for the future map.</p>
            </div>
          </div>
        </div>

        <aside class="side-panel glass-card">
          <div class="side-section">
            <p class="mini-label">Description</p>
            <h3>About this page</h3>
            <p>${config.description}</p>
          </div>

          <div class="side-section">
            <p class="mini-label">Key Insights</p>
            <ul class="insight-list">
              ${insightsHTML}
            </ul>
          </div>

          <div class="side-section">
            <p class="mini-label">Small Dashboard</p>
            <h3>${config.panelTitle}</h3>
            <div id="${config.chartId}" class="chart-placeholder">
              <span>Chart / summary placeholder</span>
            </div>
          </div>
        </aside>
      </section>
    </main>

    ${buildFooter()}
  `;
}