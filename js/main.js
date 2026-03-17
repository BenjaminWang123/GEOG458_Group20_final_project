/*
  main.js
  ------------------------------------------------------------------
  Purpose:
  Shared layout generator for the GEOG458 Group 20 Final Project website.

  What this file does:
  - Builds the shared navigation bar and footer
  - Renders the expanded Home / About page
  - Renders a shared layout template for all map pages

  Why this file matters:
  - Keeps all HTML pages short and clean
  - Maintains visual consistency across the website
  - Makes teamwork easier because the shared structure is centralized
*/

function getBasePath() {
  /*
    Detect whether the current page is in the root folder
    or inside /pages, then return the correct relative path.
  */
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

function buildNavbar(currentPage = "home") {
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
          <a href="${base}pages/category.html" class="nav-link ${currentPage === "category" ? "active" : ""}">Brands</a>
          <a href="${base}pages/temporal.html" class="nav-link ${currentPage === "temporal" ? "active" : ""}">Temporal</a>
          <a href="${base}pages/flow.html" class="nav-link ${currentPage === "flow" ? "active" : ""}">Flow</a>
        </nav>
      </div>
    </header>
  `;
}

function buildFooter() {
  return `
    <footer class="site-footer">
      <div class="container footer-content">
        <p>GEOG458 Group20 Final Project</p>
        <p>Commercial Foot Traffic Dashboard · University of Washington</p>
      </div>
    </footer>
  `;
}

function renderHomePage(targetId) {
  /*
    Renders the expanded homepage / about page:
    - hero
    - project motivation
    - project description
    - data and methods
    - page overview
    - team contributions
    - instructor / TA acknowledgement
    - tutorial
    - credits
    - references
    - GitHub + live website
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
              This project investigates how commercial activity is distributed across space, time,
              brands, and movement flows in the Seattle region. Through a multi-page interactive
              dashboard, our group visualizes urban mobility patterns and helps users explore where
              visitors go, when activity changes, which brands attract attention, and how origin-
              destination connections shape commercial geography.
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
                <p>Home / About Page</p>
              </div>
              <div class="stat-card">
                <h3>4</h3>
                <p>Interactive Map Pages</p>
              </div>
              <div class="stat-card">
                <h3>JS</h3>
                <p>Shared Layout System</p>
              </div>
              <div class="stat-card">
                <h3>GIS</h3>
                <p>Spatial Data Storytelling</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" class="section">
        <div class="container two-column">
          <div>
            <p class="section-tag">01 · Project Motivation</p>
            <h2>Why did we build this project?</h2>
          </div>
          <div>
            <p>
              Commercial spaces are shaped by human movement. Restaurants, stores, and business
              districts gain meaning not only from their locations, but also from how many people
              visit them, when activity rises or falls, and how different places are connected by
              visitor flows.
            </p>
            <p>
              Our project uses an interactive web mapping dashboard to reveal these patterns through
              multiple perspectives. Instead of putting all information on one crowded map, we
              divided the project into four focused pages so each dimension of the data can be
              explored clearly while still staying visually connected as one coherent story.
            </p>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container two-column">
          <div>
            <p class="section-tag">02 · Project Description</p>
            <h2>What does this website show?</h2>
          </div>
          <div>
            <p>
              This website is an interactive commercial foot traffic dashboard that analyzes urban
              activity using mobility-related geospatial data. The project examines commercial space
              from four main perspectives: intensity, temporal change, brand distribution, and
              visitor flows.
            </p>
            <p>
              The homepage serves as the project’s About page. It introduces the project goals,
              summarizes the data and methods, explains the purpose of each page, documents team
              member contributions, and provides credits and references for the tools and materials
              used in development.
            </p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <p class="section-tag">03 · Data & Materials</p>
          <h2>Project materials</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>Commercial POI Data</h3>
              <p>
                Business locations and place-based records were used to map commercial sites and
                support point-based visualizations.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Foot Traffic Intensity</h3>
              <p>
                Aggregated visit counts were used to build the intensity heatmap and proportional
                symbol map for comparing activity levels across commercial locations.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Temporal Activity Data</h3>
              <p>
                Monthly activity values were joined to geographic features so users can explore
                change over time using the temporal slider and dashboard statistics.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Brand & Category Information</h3>
              <p>
                Brand names and business classifications were used to support brand filtering,
                proportional circle comparison, and ranked dashboard summaries.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Flow Data</h3>
              <p>
                Origin-destination visitor records were used to build the flow page, where line
                thickness represents movement volume between origins and destinations.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Web Mapping Assets</h3>
              <p>
                Shared page templates, interactive controls, dashboard cards, legends, and Mapbox-
                based map rendering were used to create a consistent multi-page user experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-tag">04 · Methods</p>
          <h2>How does the system work?</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>Data Cleaning</h3>
              <p>
                Raw datasets were cleaned, standardized, and organized into formats such as GeoJSON
                and CSV so they could be loaded into interactive web maps.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Spatial Visualization</h3>
              <p>
                We used heatmaps, proportional circles, choropleth-style polygon visualization, and
                flow lines to represent different spatial relationships within the same project.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Interactive Filtering</h3>
              <p>
                Sliders, dropdown menus, search boxes, time controls, and layer toggles allow users
                to explore selected subsets of the data dynamically.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Dashboard Support</h3>
              <p>
                Each page includes a small dashboard or summary panel that helps explain the current
                filtered view and provides ranked or aggregated information to support the map.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pages" class="section">
        <div class="container">
          <p class="section-tag">05 · Explore Pages</p>
          <h2>Project pages</h2>

          <div class="page-card-grid">
            <a href="pages/intensity.html" class="page-card">
              <span class="page-number">01</span>
              <h3>Foot Traffic Intensity</h3>
              <p>
                This page visualizes overall commercial activity using a heatmap and reference
                points. Users can filter by year, search brands, toggle map layers, and compare the
                top brands by total visit counts.
              </p>
            </a>

            <a href="pages/temporal.html" class="page-card">
              <span class="page-number">02</span>
              <h3>Temporal Patterns</h3>
              <p>
                This page shows how activity changes over time. A monthly slider updates polygon
                colors and dashboard statistics so users can identify changing patterns, peaks, and
                active areas across time.
              </p>
            </a>

            <a href="pages/category.html" class="page-card">
              <span class="page-number">03</span>
              <h3>Brand & Category</h3>
              <p>
                This page uses a proportional circle map to compare individual business locations.
                Circle size represents visit counts, and users can filter by brand, search names,
                inspect popups, and review location-level dashboard summaries.
              </p>
            </a>

            <a href="pages/flow.html" class="page-card">
              <span class="page-number">04</span>
              <h3>Visitor Flows</h3>
              <p>
                This page focuses on movement connections between origins and destinations. Users can
                choose a year and date to view flow lines, origin points, destination points, and
                summary statistics for visitor connections.
              </p>
            </a>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-tag">06 · Team & Contributions</p>
          <h2>Project team</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>Benni Wang</h3>
              <p><strong>Email:</strong> <a href="mailto:benj91zc@uw.edu">benj91zc@uw.edu</a></p>
              <p>
                Worked on project coordination, homepage design, shared web structure, and the foot
                traffic intensity page and brand page, and map-based interactivity for both pages.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Vamika Goel</h3>
              <p><strong>Email:</strong> <a href="mailto:vamikag@uw.edu">vamikag@uw.edu</a></p>
              <p>
                Developed the brand and category page using a proportional circle map with brand
                filtering, location inspection, legend design, and summary dashboard support.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Yuanfan Wang</h3>
              <p><strong>Email:</strong> <a href="mailto:yuanfw2@uw.edu">yuanfw2@uw.edu</a></p>
              <p>
                Built the visitor flow page using origin-destination data, time selection controls,
                flow line rendering, and summary statistics for movement patterns.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>Aditee Elkunchwar</h3>
              <p><strong>Email:</strong> <a href="mailto:aditee@uw.edu">aditee@uw.edu</a></p>
              <p>
                Developed the temporal patterns page using a monthly time slider, polygon-based
                activity visualization, popup inspection, and temporal dashboard statistics.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container two-column">
          <div>
            <p class="section-tag">07 · Instructor & TA Support</p>
            <h2>Course acknowledgement</h2>
          </div>
          <div>
            <p>
              This project was developed for GEOG458: Advanced Digital Geographies at the University
              of Washington.
            </p>

            <p>
              <strong>Professor:</strong><br>
              Bo Zhao — <a href="mailto:zhaobo@uw.edu">zhaobo@uw.edu</a>
            </p>

            <p>
              <strong>Teaching Assistants:</strong><br>
              Liz Peng — <a href="mailto:lp36@uw.edu">lp36@uw.edu</a><br>
              Alex Kirchmeier — <a href="mailto:alexak24@uw.edu">alexak24@uw.edu</a>
            </p>

            <p>
              We would like to thank our instructor and teaching assistants for their teaching,
              feedback, and support throughout the project. Their guidance on digital geographies,
              spatial analysis, and interactive web mapping strongly shaped the final result.
            </p>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-tag">08 · Project Links</p>
          <h2>Access the project</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>Live Website</h3>
              <p>
                <a href="https://benjaminwang123.github.io/GEOG458_Group20_final_project/" target="_blank">
                  View Project Website
                </a>
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>GitHub Repository</h3>
              <p>
                <a href="https://github.com/BenjaminWang123/GEOG458_Group20_final_project" target="_blank">
                  github link
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <p class="section-tag">09 · How to Use the Dashboard</p>
          <h2>Tutorial</h2>

          <div class="glass-card source-card">
            <p>
              This dashboard is designed to be explored interactively. Follow the steps below to
              navigate the website and understand how each page works.
            </p>

            <ol style="line-height: 1.9; padding-left: 24px; margin-top: 16px;">
              <li>
                Start from the Home page to read the project description, data sources, methods,
                team contributions, and page overview.
              </li>
              <li>
                Use the navigation bar at the top of the website to switch between the Intensity,
                Brands, Temporal, and Flow pages.
              </li>
              <li>
                On the Intensity page, use the year slider and brand search box to explore where
                commercial activity is concentrated and compare top brands by visit counts.
              </li>
              <li>
                On the Temporal page, move the month slider to compare how activity changes across
                time and observe how the mapped values and dashboard summaries update.
              </li>
              <li>
                On the Brand & Category page, use the brand dropdown and search function to filter
                locations, then click proportional circles on the map to inspect detailed place-
                level information.
              </li>
              <li>
                On the Flow page, choose a year and date to visualize visitor movement between
                origins and destinations and compare the strength of flow connections.
              </li>
              <li>
                Use legends, popups, filters, and small dashboard panels on each page to help
                interpret the data and understand the meaning of the current map view.
              </li>
              <li>
                Return to the Home page at any time if you want to review the full project context,
                credits, references, and access links.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-tag">10 · Credits</p>
          <h2>Technologies & libraries</h2>

          <div class="source-grid">
            <div class="glass-card source-card">
              <h3>Mapbox GL JS</h3>
              <p>
                Used to render the interactive maps across the intensity, temporal, category, and
                flow pages.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>JavaScript</h3>
              <p>
                Used for interactive controls, filtering logic, dashboard updates, and shared page
                rendering.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>D3.js</h3>
              <p>
                Used on the flow page to load and process the CSV-based origin-destination data.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>HTML & CSS</h3>
              <p>
                Used to build the website structure, responsive layout, dashboard cards, and shared
                visual style.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>GeoJSON & CSV</h3>
              <p>
                Used as the main spatial and tabular data formats for the four project pages.
              </p>
            </div>

            <div class="glass-card source-card">
              <h3>GitHub Pages</h3>
              <p>
                Used to host and publish the final website as a publicly accessible class project.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container two-column">
          <div>
            <p class="section-tag">11 · References</p>
            <h2>Data & academic references</h2>
          </div>
          <div>
            <p>
              [1] Advan / mobility-based neighborhood or visitation datasets used for commercial
              foot traffic analysis.
            </p>
            <p>
              [2] GEOG458 course materials, lectures, and project guidance from the University of
              Washington.
            </p>
            <p>
              [3] Mapbox GL JS Documentation.
            </p>
            <p>
              [4] GeoJSON Specification.
            </p>
            <p>
              [5] Open-source web mapping and geospatial visualization resources used during
              development and debugging.
            </p>
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

  const insightsHTML = (config.insights || [])
    .map((item) => `<li>${item}</li>`)
    .join("");

  const toolbarHTML = (config.toolbar || [])
    .map((item) => `<span class="tool-pill">${item}</span>`)
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
              <p>This area is reserved for the interactive map.</p>
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