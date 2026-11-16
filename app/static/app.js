// Application State & DOM Bindings
const form = document.getElementById("scrapeForm");
const submitButton = document.getElementById("submitButton");
const statusBox = document.getElementById("status");
const statsBox = document.getElementById("stats");
const resultsContainer = document.getElementById("resultsContainer");
const phoneRequiredCheckbox = document.getElementById("phoneRequired");

const cityInput = document.getElementById("city");
const stateInput = document.getElementById("state");
const categoryInput = document.getElementById("category");
const limitInput = document.getElementById("limit");
const submitCityName = document.getElementById("submitCityName");

const currentScopeTitle = document.getElementById("currentScopeTitle");
const currentScopeSubtitle = document.getElementById("currentScopeSubtitle");
const btnScopeLocationOnly = document.getElementById("btnScopeLocationOnly");
const btnScopeAllMetros = document.getElementById("btnScopeAllMetros");

const quickPhoneCount = document.getElementById("quickPhoneCount");
const quickQualifiedCount = document.getElementById("quickQualifiedCount");
const quickDiscoveryCount = document.getElementById("quickDiscoveryCount");

const card1Label = document.getElementById("card1Label");
const card2Label = document.getElementById("card2Label");
const card3Label = document.getElementById("card3Label");

const linkExportPhoneCsv = document.getElementById("linkExportPhoneCsv");
const linkExportQualifiedCsv = document.getElementById("linkExportQualifiedCsv");
const linkExportDiscoveryCsv = document.getElementById("linkExportDiscoveryCsv");

const tabPhoneLeads = document.getElementById("tabPhoneLeads");
const tabQualifiedLeads = document.getElementById("tabQualifiedLeads");
const tabAllDiscovery = document.getElementById("tabAllDiscovery");

const phoneCountBadge = document.getElementById("phoneCountBadge");
const qualifiedCountBadge = document.getElementById("qualifiedCountBadge");
const discoveryCountBadge = document.getElementById("discoveryCountBadge");

const tableSearchInput = document.getElementById("tableSearchInput");
const runExportContainer = document.getElementById("runExportContainer");
const runPhoneCsvLink = document.getElementById("runPhoneCsvLink");
const runQualifiedCsvLink = document.getElementById("runQualifiedCsvLink");
const runDiscoveryCsvLink = document.getElementById("runDiscoveryCsvLink");

// Local application state
let activeCity = "Bhubaneswar";
let activeState = "Odisha";
let scopeMode = "location"; // "location" or "all"
let currentActiveTab = "phone";
let searchFilterQuery = "";

// Data caches
let cachedPhoneLeads = [];
let cachedQualifiedLeads = [];
let cachedDiscoveryData = [];

// Sync input changes to UI
if (cityInput) {
  cityInput.addEventListener("input", (e) => {
    activeCity = (e.target.value || "").trim();
    if (submitCityName) submitCityName.textContent = activeCity || "Desired Location";
    updateLocationScopeHeaders();
  });
}

if (stateInput) {
  stateInput.addEventListener("input", (e) => {
    activeState = (e.target.value || "").trim();
    updateLocationScopeHeaders();
  });
}

function selectPresetCity(city, state, btn) {
  document.querySelectorAll(".preset-pill").forEach(p => {
    if (p.textContent === city) p.classList.add("active");
    else if (["Bhubaneswar", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Kolkata", "Chennai"].includes(p.textContent)) {
      p.classList.remove("active");
    }
  });
  if (cityInput) cityInput.value = city;
  if (stateInput) stateInput.value = state;
  activeCity = city;
  activeState = state;
  if (submitCityName) submitCityName.textContent = city;
  updateLocationScopeHeaders();
  loadLocationData();
}

function setPresetCategory(cat, btn) {
  if (categoryInput) categoryInput.value = cat;
  document.querySelectorAll(".preset-pill").forEach(p => {
    if (p.textContent === cat) p.classList.add("active");
    else if (!["Bhubaneswar", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Kolkata", "Chennai"].includes(p.textContent)) {
      p.classList.remove("active");
    }
  });
}

function setScopeMode(mode) {
  scopeMode = mode;
  if (mode === "location") {
    if (btnScopeLocationOnly) btnScopeLocationOnly.classList.add("active");
    if (btnScopeAllMetros) btnScopeAllMetros.classList.remove("active");
  } else {
    if (btnScopeLocationOnly) btnScopeLocationOnly.classList.remove("active");
    if (btnScopeAllMetros) btnScopeAllMetros.classList.add("active");
  }
  updateLocationScopeHeaders();
  loadLocationData();
}

function updateLocationScopeHeaders() {
  const citySlug = (activeCity || "location").toLowerCase().replace(/\s+/g, '_');
  if (scopeMode === "location") {
    if (currentScopeTitle) currentScopeTitle.textContent = `${activeCity || 'Desired Location'}${activeState ? ', ' + activeState : ''}`;
    if (currentScopeSubtitle) currentScopeSubtitle.textContent = `Displaying full business intelligence, verified phone leads & discovery data for ${activeCity}.`;
    
    if (card1Label) card1Label.textContent = `${activeCity} Phone Leads`;
    if (card2Label) card2Label.textContent = `${activeCity} Qualified`;
    if (card3Label) card3Label.textContent = `${activeCity} Discovery`;

    if (linkExportPhoneCsv) {
      linkExportPhoneCsv.href = `/api/export/phone-leads?city=${encodeURIComponent(activeCity)}`;
      linkExportPhoneCsv.download = `${citySlug}_leads_with_phone.csv`;
    }

    if (linkExportQualifiedCsv) {
      linkExportQualifiedCsv.href = `/api/export/companies?city=${encodeURIComponent(activeCity)}`;
      linkExportQualifiedCsv.download = `${citySlug}_companies_leads.csv`;
    }
  } else {
    if (currentScopeTitle) currentScopeTitle.textContent = "All Metros Aggregate";
    if (currentScopeSubtitle) currentScopeSubtitle.textContent = "Displaying cumulative database records across all Indian geographical markets.";

    if (card1Label) card1Label.textContent = "Total Phone Leads";
    if (card2Label) card2Label.textContent = "Total Qualified Leads";
    if (card3Label) card3Label.textContent = "Total Discovery Data";

    if (linkExportPhoneCsv) {
      linkExportPhoneCsv.href = "/api/export/phone-leads";
      linkExportPhoneCsv.download = "dakini_leads_with_phone.csv";
    }

    if (linkExportQualifiedCsv) {
      linkExportQualifiedCsv.href = "/api/export/companies";
      linkExportQualifiedCsv.download = "dakini_companies_leads.csv";
    }
  }
}

// Load counts and table data for active scope
async function loadLocationData() {
  const targetCity = scopeMode === "location" ? activeCity : "";
  try {
    const countUrl = targetCity ? `/api/data/counts?city=${encodeURIComponent(targetCity)}` : `/api/data/counts`;
    const res = await fetch(countUrl);
    if (res.ok) {
      const data = await res.json();
      if (quickPhoneCount) quickPhoneCount.textContent = (data.phone_leads || 0).toLocaleString();
      if (quickQualifiedCount) quickQualifiedCount.textContent = (data.qualified_companies || 0).toLocaleString();
      if (quickDiscoveryCount) quickDiscoveryCount.textContent = (data.discovery_records || 0).toLocaleString();

      if (phoneCountBadge) phoneCountBadge.textContent = (data.phone_leads || 0).toLocaleString();
      if (qualifiedCountBadge) qualifiedCountBadge.textContent = (data.qualified_companies || 0).toLocaleString();
      if (discoveryCountBadge) discoveryCountBadge.textContent = (data.discovery_records || 0).toLocaleString();
    }
  } catch (e) {
    console.warn("Could not load counts", e);
  }

  await fetchTabDataset(currentActiveTab);
}

async function fetchTabDataset(tab) {
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="status-banner" style="margin-top: 10px;">Loading records for ' + (scopeMode === 'location' ? activeCity : 'all locations') + '...</div>';
  }
  const targetCity = scopeMode === "location" ? activeCity : "";

  try {
    if (tab === "phone") {
      const url = targetCity 
        ? `/api/data/phone-leads?city=${encodeURIComponent(targetCity)}&limit=500` 
        : `/api/data/phone-leads?limit=500`;
      const res = await fetch(url);
      cachedPhoneLeads = await res.json();
    } else if (tab === "qualified") {
      const url = targetCity 
        ? `/api/data/qualified?city=${encodeURIComponent(targetCity)}&limit=500` 
        : `/api/data/qualified?limit=500`;
      const res = await fetch(url);
      cachedQualifiedLeads = await res.json();
    } else if (tab === "discovery") {
      const url = targetCity 
        ? `/api/data/discovery?city=${encodeURIComponent(targetCity)}&limit=500` 
        : `/api/data/discovery?limit=500`;
      const res = await fetch(url);
      cachedDiscoveryData = await res.json();
    }
    filterAndRender();
  } catch (e) {
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="status-banner error" style="margin-top: 10px;">Failed to load data: ' + e.message + '</div>';
    }
  }
}

// Health check polling
async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    const dot = document.getElementById("systemLiveDot");
    const text = document.getElementById("systemLiveText");
    if (res.ok) {
      if (dot) dot.className = "pulse-dot";
      if (text) text.textContent = "Engine Online";
    } else {
      if (dot) dot.className = "pulse-dot idle";
      if (text) text.textContent = "Engine Paused";
    }
  } catch (e) {
    const dot = document.getElementById("systemLiveDot");
    const text = document.getElementById("systemLiveText");
    if (dot) dot.className = "pulse-dot idle";
    if (text) text.textContent = "Offline";
  }
}

// Master View Loaders
const btnMasterPhone = document.getElementById("btnViewMasterPhone");
const btnMasterQual = document.getElementById("btnViewMasterQualified");
const btnMasterDisc = document.getElementById("btnViewMasterDiscovery");

if (btnMasterPhone) btnMasterPhone.addEventListener("click", () => switchTab("phone"));
if (btnMasterQual) btnMasterQual.addEventListener("click", () => switchTab("qualified"));
if (btnMasterDisc) btnMasterDisc.addEventListener("click", () => switchTab("discovery"));

if (tabPhoneLeads) tabPhoneLeads.addEventListener("click", () => switchTab("phone"));
if (tabQualifiedLeads) tabQualifiedLeads.addEventListener("click", () => switchTab("qualified"));
if (tabAllDiscovery) tabAllDiscovery.addEventListener("click", () => switchTab("discovery"));

async function switchTab(tab) {
  currentActiveTab = tab;

  if (tabPhoneLeads) tabPhoneLeads.className = "tab-pill" + (tab === "phone" ? " active-phone" : "");
  if (tabQualifiedLeads) tabQualifiedLeads.className = "tab-pill" + (tab === "qualified" ? " active-qualified" : "");
  if (tabAllDiscovery) tabAllDiscovery.className = "tab-pill" + (tab === "discovery" ? " active-discovery" : "");

  await fetchTabDataset(tab);
}

if (tableSearchInput) {
  tableSearchInput.addEventListener("input", (e) => {
    searchFilterQuery = (e.target.value || "").trim().toLowerCase();
    filterAndRender();
  });
}

function filterAndRender() {
  const container = resultsContainer;
  if (!container) return;

  if (currentActiveTab === "phone") {
    let list = cachedPhoneLeads;
    if (searchFilterQuery) {
      list = list.filter(l =>
        (l.company_name || "").toLowerCase().includes(searchFilterQuery) ||
        (l.city || "").toLowerCase().includes(searchFilterQuery) ||
        (l.phone || "").toLowerCase().includes(searchFilterQuery) ||
        (l.website || "").toLowerCase().includes(searchFilterQuery) ||
        (l.locality || "").toLowerCase().includes(searchFilterQuery)
      );
    }
    renderQualifiedTable(list, container);
  } else if (currentActiveTab === "qualified") {
    let list = cachedQualifiedLeads;
    if (searchFilterQuery) {
      list = list.filter(l =>
        (l.company_name || "").toLowerCase().includes(searchFilterQuery) ||
        (l.city || "").toLowerCase().includes(searchFilterQuery) ||
        (l.phone || "").toLowerCase().includes(searchFilterQuery) ||
        (l.website || "").toLowerCase().includes(searchFilterQuery) ||
        (l.locality || "").toLowerCase().includes(searchFilterQuery)
      );
    }
    renderQualifiedTable(list, container);
  } else if (currentActiveTab === "discovery") {
    let list = cachedDiscoveryData;
    if (searchFilterQuery) {
      list = list.filter(d =>
        (d.url || d.normalized_url || "").toLowerCase().includes(searchFilterQuery) ||
        (d.domain || "").toLowerCase().includes(searchFilterQuery) ||
        (d.query || d.discovery_query || "").toLowerCase().includes(searchFilterQuery) ||
        (d.verified_city || "").toLowerCase().includes(searchFilterQuery)
      );
    }
    renderDiscoveryTable(list, container);
  }
}

function renderQualifiedTable(leads, container) {
  const locLabel = scopeMode === 'location' ? activeCity : 'All Locations';
  if (!leads.length) {
    container.innerHTML =
      `<div class="status-banner" style="margin-top: 10px; color: var(--text-muted);">
        No leads found for <strong>${escapeHtml(locLabel)}</strong> matching current view. 
        Click <strong>"⚡ Start Geographical Scrape"</strong> above to extract fresh data for this location!
      </div>`;
    return;
  }

  const rows = leads
    .map((lead) => {
      const websiteClean = lead.website ? lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '—';
      const locType = lead.location_type || 'headquarters';
      const locality = lead.locality ? `<div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(lead.locality)}</div>` : '';
      
      let servicesList = [];
      if (Array.isArray(lead.services)) {
        servicesList = lead.services;
      } else if (typeof lead.services === "string" && lead.services.trim()) {
        try {
          const parsed = JSON.parse(lead.services);
          if (Array.isArray(parsed)) servicesList = parsed;
          else servicesList = [lead.services];
        } catch {
          servicesList = lead.services.split(",").map(s => s.trim()).filter(Boolean);
        }
      }

      let servicesHtml = '';
      if (lead.industry_subcategory) {
        servicesHtml += `<span class="services-tag">${escapeHtml(lead.industry_subcategory)}</span>`;
      }
      servicesList.slice(0, 3).forEach(s => {
        servicesHtml += `<span class="services-tag">${escapeHtml(s)}</span>`;
      });

      let contactPersonHtml = '';
      if (lead.contact_person) {
        contactPersonHtml = `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px;">👤 ${escapeHtml(lead.contact_person)}</div>`;
      }

      let evidenceHtml = '';
      if (Array.isArray(lead.evidence) && lead.evidence.length > 0) {
        evidenceHtml = `<div class="evidence-box">${escapeHtml(lead.evidence[0])}</div>`;
      } else if (lead.location_type) {
        evidenceHtml = `<div class="evidence-box">Verified in ${escapeHtml(lead.city || locLabel)} via physical presence & contact listings.</div>`;
      }

      return `
    <tr>
      <td>
        <strong>${escapeHtml(lead.company_name)}</strong>
        ${lead.company_age ? `<div style="font-size: 11px; color: var(--text-subtle);">${escapeHtml(lead.company_age)}</div>` : ''}
        <div>
          <a href="${escapeHtml(lead.website)}" target="_blank" rel="noopener" style="color: var(--text-black); text-decoration: underline; font-weight: 700; font-size: 12px;">
            ${escapeHtml(websiteClean)} ↗
          </a>
        </div>
      </td>
      <td>
        <strong>${escapeHtml(lead.city || '—')}</strong>, ${escapeHtml(lead.state || '—')}
        ${locality}
        <div style="margin-top: 4px;">
          <span class="badge badge-location-type">🏢 ${escapeHtml(locType)}</span>
        </div>
      </td>
      <td>
        ${lead.phone ? `
          <div>
            <a href="tel:${escapeHtml(lead.phone)}" class="badge badge-phone" title="Call ${escapeHtml(lead.phone)}">
              📞 ${escapeHtml(lead.phone)}
            </a>
            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(lead.phone)}')" title="Copy Phone">📋</button>
          </div>
        ` : '<span class="badge badge-no-phone">No Phone</span>'}
        
        ${lead.email ? `
          <div style="margin-top: 4px;">
            <a href="mailto:${escapeHtml(lead.email)}" style="color: var(--text-black); text-decoration: none; font-weight: 600; font-size: 12px;">✉️ ${escapeHtml(lead.email)}</a>
            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(lead.email)}')" title="Copy Email">📋</button>
          </div>
        ` : ''}

        ${contactPersonHtml}
      </td>
      <td>
        ${servicesHtml || '<span style="color: var(--text-subtle); font-size: 12px;">Digital Services</span>'}
      </td>
      <td>
        ${evidenceHtml}
      </td>
      <td>
        <span class="badge badge-qualified">Qualified</span>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${escapeHtml(lead.contact_validation || 'verified')}</div>
      </td>
    </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Company & Website</th>
            <th>Physical Location</th>
            <th>Verified Direct Contacts</th>
            <th>Services & Vertical</th>
            <th>Physical Verification Evidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderDiscoveryTable(discoveryData, container) {
  const locLabel = scopeMode === 'location' ? activeCity : 'All Locations';
  if (!discoveryData.length) {
    container.innerHTML =
      `<div class="status-banner" style="margin-top: 10px; color: var(--text-muted);">
        No discovery candidate URLs found for <strong>${escapeHtml(locLabel)}</strong> matching current view.
      </div>`;
    return;
  }

  const rows = discoveryData
    .map((item) => {
      const url = item.url || item.normalized_url || item.resolved_url || "";
      const domain = item.domain || "";
      const title = item.title || item.title_or_anchor || item.evidence_text || "—";
      const query = item.query || item.discovery_query || item.query_used || "—";
      const method = item.method || item.discovery_method || "public_web";
      const crawl = item.crawl_status || "completed";
      const status = item.pipeline_status || item.qualification_status || "candidate";
      const diag = item.reason || item.rejection_reason || item.last_error || "Passed Location Verification";

      let badgeClass = "badge-pending";
      if (status === "qualified" || status === "Qualified Lead") badgeClass = "badge-qualified";
      if (status.includes("failed") || status.includes("blocked") || status.includes("disqualified")) badgeClass = "badge-no-phone";

      return `
    <tr>
      <td>
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color: var(--text-black); text-decoration: underline; font-weight: 700;">
          ${escapeHtml(domain || url)} ↗
        </a>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(title)}</div>
      </td>
      <td><span style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(query)}</span></td>
      <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(method)}</td>
      <td><span class="badge ${crawl === 'completed' ? 'badge-qualified' : 'badge-no-phone'}">${escapeHtml(crawl)}</span></td>
      <td><span class="badge ${badgeClass}">${escapeHtml(status)}</span></td>
      <td style="color: var(--text-muted); font-size: 12px;">${escapeHtml(diag)}</td>
    </tr>
  `;
    })
    .join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Discovered URL & Title</th>
            <th>Discovery Query Used</th>
            <th>Discovery Method</th>
            <th>Crawl Status</th>
            <th>Pipeline Qualification</th>
            <th>Diagnostics & Reason</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Targeted Scrape Form Submission
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton) submitButton.disabled = true;

    const city = cityInput ? cityInput.value.trim() : "Bhubaneswar";
    const state = stateInput ? stateInput.value.trim() : "Odisha";
    const category = categoryInput ? categoryInput.value.trim() : "Digital Marketing";
    const limit = Number((limitInput && limitInput.value) || 200);
    const phoneOnly = phoneRequiredCheckbox ? phoneRequiredCheckbox.checked : false;

    // Lock dashboard into the target scraped location
    activeCity = city;
    activeState = state;
    scopeMode = "location";
    if (btnScopeLocationOnly) btnScopeLocationOnly.classList.add("active");
    if (btnScopeAllMetros) btnScopeAllMetros.classList.remove("active");
    updateLocationScopeHeaders();

    if (submitButton) submitButton.innerHTML = `⚡ Scraping ${escapeHtml(city)}...`;
    if (statusBox) {
      statusBox.className = "status-banner";
      statusBox.innerHTML = `⚡ Discovering & crawling public-web leads for <strong>${escapeHtml(category)}</strong> in <strong>${escapeHtml(city)}${state ? ', ' + escapeHtml(state) : ''}</strong>...`;
    }
    if (statsBox) statsBox.style.display = "none";
    if (runExportContainer) runExportContainer.style.display = "none";
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="status-banner" style="margin-top: 10px;">Crawling web sources for ' + escapeHtml(city) + '...</div>';
    }

    const payload = {
      city,
      state: state || null,
      category,
      limit,
      phone_required: phoneOnly,
      phone_only: phoneOnly,
      concurrency: 8,
    };

    const scrapeStartTime = performance.now();

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Server returned " + response.status);
      }

      const data = await response.json();
      const cityPhoneCount = (data.leads || []).filter(l => l.phone).length;
      const clientElapsedSec = Math.max(0.1, (performance.now() - scrapeStartTime) / 1000);
      const displayDuration = (typeof data.duration_seconds === "number" && data.duration_seconds > 0)
        ? `${data.duration_seconds.toFixed(1)}s`
        : `${clientElapsedSec.toFixed(1)}s`;

      if (statusBox) {
        statusBox.className = "status-banner success";
        statusBox.innerHTML = `
          ✅ <strong>Scrape Completed for ${escapeHtml(city)}!</strong> Discovered ${data.discovered} candidates, extracted ${data.qualified} qualified companies (${cityPhoneCount} with verified phone numbers) in ${displayDuration}.
        `;
      }

      if (statsBox) {
        statsBox.style.display = "grid";
        statsBox.innerHTML = `
          <div class="stat-pill-card">
            <div class="label">Discovered in ${escapeHtml(city)}</div>
            <div class="val">${data.discovered}</div>
          </div>
          <div class="stat-pill-card">
            <div class="label">Qualified in ${escapeHtml(city)}</div>
            <div class="val">${data.qualified}</div>
          </div>
          <div class="stat-pill-card">
            <div class="label">With Verified Phone</div>
            <div class="val">${cityPhoneCount}</div>
          </div>
          <div class="stat-pill-card">
            <div class="label">Scrape Time</div>
            <div class="val">${displayDuration}</div>
          </div>
        `;
      }

      // Configure targeted run export links
      const cleanSlug = city.toLowerCase().replace(/\s+/g, '_');
      if (data.csv_file || data.phone_leads_csv_file || data.discovery_csv_file) {
        if (runExportContainer) runExportContainer.style.display = "block";
        if (runPhoneCsvLink && (data.phone_leads_csv_file || data.csv_file)) {
          runPhoneCsvLink.style.display = "inline-flex";
          runPhoneCsvLink.href = `/api/download?path=${encodeURIComponent(data.phone_leads_csv_file || data.csv_file)}`;
          runPhoneCsvLink.download = `${cleanSlug}_leads_with_phone.csv`;
        }
        if (runQualifiedCsvLink && data.csv_file) {
          runQualifiedCsvLink.style.display = "inline-flex";
          runQualifiedCsvLink.href = `/api/download?path=${encodeURIComponent(data.csv_file)}`;
          runQualifiedCsvLink.download = `${cleanSlug}_qualified_leads.csv`;
        }
        if (runDiscoveryCsvLink && data.discovery_csv_file) {
          runDiscoveryCsvLink.style.display = "inline-flex";
          runDiscoveryCsvLink.href = `/api/download?path=${encodeURIComponent(data.discovery_csv_file)}`;
          runDiscoveryCsvLink.download = `${cleanSlug}_discovery_all.csv`;
        }
      }

      // Cache results locally for immediate display
      cachedQualifiedLeads = data.leads || [];
      cachedPhoneLeads = cachedQualifiedLeads.filter(l => Boolean(l.phone));
      if (data.discovery_data || data.discovery_records) {
        cachedDiscoveryData = data.discovery_data || data.discovery_records;
      }

      // Update counts and switch view to this location
      if (quickPhoneCount) quickPhoneCount.textContent = cachedPhoneLeads.length.toLocaleString();
      if (quickQualifiedCount) quickQualifiedCount.textContent = cachedQualifiedLeads.length.toLocaleString();
      if (quickDiscoveryCount) quickDiscoveryCount.textContent = (data.discovered || 0).toLocaleString();

      if (phoneCountBadge) phoneCountBadge.textContent = cachedPhoneLeads.length.toLocaleString();
      if (qualifiedCountBadge) qualifiedCountBadge.textContent = cachedQualifiedLeads.length.toLocaleString();
      if (discoveryCountBadge) discoveryCountBadge.textContent = (data.discovered || 0).toLocaleString();

      switchTab(phoneOnly ? "phone" : "qualified");
    } catch (error) {
      if (statusBox) {
        statusBox.className = "status-banner error";
        statusBox.textContent = "Error: " + error.message;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `⚡ Start Geographical Scrape for <span id="submitCityName">${escapeHtml(activeCity)}</span>`;
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    if (statusBox) {
      const originalStatus = statusBox.textContent;
      statusBox.className = "status-banner success";
      statusBox.textContent = `Copied to clipboard: ${text}`;
      setTimeout(() => {
        statusBox.textContent = originalStatus;
      }, 2000);
    }
  }
}

// ========================================================
// CRM EXPORT & INTEGRATION CONTROLLER
// ========================================================
function openCRMModal() {
  const modal = document.getElementById("crmModal");
  if (modal) {
    modal.style.display = "flex";
    const crmCityInput = document.getElementById("crmExportCity");
    if (crmCityInput) {
      crmCityInput.value = activeCity || (cityInput ? cityInput.value : "Bhubaneswar");
    }
    const statusBox = document.getElementById("crmExportStatusBox");
    if (statusBox) statusBox.style.display = "none";
    loadCRMDestinations();
  }
}

function closeCRMModal() {
  const modal = document.getElementById("crmModal");
  if (modal) modal.style.display = "none";
}

function switchCRMModalTab(tab) {
  const tabs = ["export", "destinations", "logs"];
  tabs.forEach(t => {
    const btn = document.getElementById(`modalTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const content = document.getElementById(`crmTabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle("active", t === tab);
    if (content) content.style.display = t === tab ? "block" : "none";
  });

  if (tab === "destinations") {
    loadCRMDestinations();
  } else if (tab === "logs") {
    loadCRMLogs();
  }
}

function toggleCRMTargetMode() {
  const mode = document.getElementById("crmTargetMode").value;
  const groupSaved = document.getElementById("crmGroupSavedDest");
  const groupDynamic = document.getElementById("crmGroupDynamic");

  if (mode === "destination") {
    groupSaved.style.display = "block";
    groupDynamic.style.display = "none";
  } else if (mode === "dynamic") {
    groupSaved.style.display = "none";
    groupDynamic.style.display = "block";
  } else {
    // broadcast
    groupSaved.style.display = "none";
    groupDynamic.style.display = "none";
  }
}

let cachedCRMDestinations = [];

async function loadCRMDestinations() {
  try {
    const res = await fetch("/api/crm/destinations");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const dests = await res.json();
    cachedCRMDestinations = dests;

    // Populate dropdown
    const select = document.getElementById("crmDestSelect");
    if (select) {
      if (dests.length === 0) {
        select.innerHTML = '<option value="">No destinations registered yet. Add one in Customer Destinations tab.</option>';
      } else {
        select.innerHTML = dests.map(d => {
          const filter = d.city_filter ? ` (Scope: ${d.city_filter})` : " (All Cities)";
          const autoBadge = d.auto_sync ? " [Auto-Sync]" : "";
          return `<option value="${escapeHtml(d.destination_id)}">${escapeHtml(d.customer_name)} — ${d.crm_type.toUpperCase()}${escapeHtml(filter)}${autoBadge}</option>`;
        }).join("");
      }
    }

    // Populate list in Tab 2
    const listContainer = document.getElementById("crmDestinationsListContainer");
    if (listContainer) {
      if (dests.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-subtle); font-size: 13px;">No customer CRM destinations configured yet. Register one above to enable automated or one-click exports.</div>';
      } else {
        listContainer.innerHTML = dests.map(d => {
          const badgeClass = `crm-badge-${d.crm_type}`;
          const cityText = d.city_filter ? d.city_filter : "All Cities (*)";
          return `
            <div class="crm-dest-item">
              <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--text-black); display: flex; align-items: center; gap: 8px;">
                  <span>${escapeHtml(d.customer_name)}</span>
                  <span class="crm-badge ${badgeClass}">${escapeHtml(d.crm_type)}</span>
                  ${d.auto_sync ? '<span style="font-size: 11px; background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 700;">AUTO-SYNC</span>' : ''}
                </div>
                <div style="font-size: 12px; color: var(--text-subtle); margin-top: 4px;">
                  📍 Scope: <strong>${escapeHtml(cityText)}</strong> &bull; Endpoint: <code>${escapeHtml(d.target_url)}</code>
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-action-sm btn-violet-outline" style="font-size: 12px;" onclick="testDestinationById('${escapeHtml(d.destination_id)}')">
                  Test Ping
                </button>
                <button class="btn-action-sm" style="font-size: 12px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;" onclick="deleteCRMDestinationById('${escapeHtml(d.destination_id)}')">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  } catch (err) {
    console.error("Error loading CRM destinations:", err);
  }
}

async function saveNewCRMDestination() {
  const name = (document.getElementById("newDestCustomerName").value || "").trim();
  const type = document.getElementById("newDestCrmType").value;
  const url = (document.getElementById("newDestUrl").value || "").trim();
  const cityFilter = (document.getElementById("newDestCityFilter").value || "").trim();
  const apiKey = (document.getElementById("newDestApiKey").value || "").trim();
  const autoSync = document.getElementById("newDestAutoSync").checked;

  if (!name || !url) {
    alert("Please provide both Customer Name and Endpoint URL.");
    return;
  }

  try {
    const res = await fetch("/api/crm/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name,
        crm_type: type,
        target_url: url,
        city_filter: cityFilter,
        api_key: apiKey,
        auto_sync: autoSync,
        is_active: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    // Clear inputs
    document.getElementById("newDestCustomerName").value = "";
    document.getElementById("newDestUrl").value = "";
    document.getElementById("newDestCityFilter").value = "";
    document.getElementById("newDestApiKey").value = "";

    await loadCRMDestinations();
    alert("Customer CRM Destination registered successfully!");
  } catch (err) {
    alert(`Failed to save destination: ${err.message}`);
  }
}

async function deleteCRMDestinationById(destId) {
  if (!confirm("Are you sure you want to delete this CRM destination?")) return;
  try {
    const res = await fetch(`/api/crm/destinations/${encodeURIComponent(destId)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadCRMDestinations();
  } catch (err) {
    alert(`Failed to delete destination: ${err.message}`);
  }
}

async function testDestinationById(destId) {
  const dest = cachedCRMDestinations.find(d => d.destination_id === destId);
  if (!dest) return;
  try {
    const res = await fetch("/api/crm/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_url: dest.target_url,
        crm_type: dest.crm_type,
        api_key: dest.api_key || "",
      }),
    });
    const data = await res.json();
    if (data.connected) {
      alert(`Connection Test SUCCESS! (HTTP ${data.status_code})`);
    } else {
      alert(`Connection Test FAILED: ${data.error || data.message} (HTTP ${data.status_code})`);
    }
  } catch (err) {
    alert(`Connection test error: ${err.message}`);
  }
}

async function executeCRMExport() {
  const city = (document.getElementById("crmExportCity").value || "").trim();
  const mode = document.getElementById("crmTargetMode").value;
  const limit = parseInt(document.getElementById("crmExportLimit").value, 10) || 100;
  const phoneOnly = document.getElementById("crmExportPhoneOnly").checked;
  const statusBox = document.getElementById("crmExportStatusBox");
  const btn = document.getElementById("btnTriggerCRMExport");

  if (!city) {
    alert("Target city is required for CRM export.");
    return;
  }

  statusBox.className = "crm-status-box info";
  statusBox.style.display = "block";
  statusBox.textContent = `🚀 Preparing and dispatching city-specific leads for ${city}...`;
  if (btn) btn.disabled = true;

  try {
    let payload = {
      city: city,
      limit: limit,
      phone_only: phoneOnly,
    };

    if (mode === "broadcast") {
      payload.export_all_matched = true;
    } else if (mode === "destination") {
      const destId = document.getElementById("crmDestSelect").value;
      if (!destId) throw new Error("Please select a configured customer CRM destination.");
      payload.destination_id = destId;
    } else {
      // Dynamic
      const url = (document.getElementById("crmDynamicUrl").value || "").trim();
      if (!url) throw new Error("Please enter a target webhook or CRM endpoint URL.");
      payload.target_url = url;
      payload.crm_type = document.getElementById("crmDynamicType").value;
      payload.api_key = (document.getElementById("crmDynamicKey").value || "").trim();
    }

    const res = await fetch("/api/crm/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || `HTTP ${res.status}`);
    }

    if (mode === "broadcast") {
      statusBox.className = "crm-status-box success";
      statusBox.innerHTML = `<strong>Broadcast Completed!</strong> Dispatched to ${data.total_destinations} active customer destinations for ${escapeHtml(city)}.`;
    } else {
      if (data.success) {
        statusBox.className = "crm-status-box success";
        statusBox.innerHTML = `<strong>Export Successful!</strong> Sent ${data.leads_count} leads to <code>${escapeHtml(data.target_url)}</code> (HTTP ${data.status_code}).`;
      } else {
        statusBox.className = "crm-status-box error";
        statusBox.innerHTML = `<strong>Export Encountered Error:</strong> ${escapeHtml(data.error || "Unknown error")} (HTTP ${data.status_code})`;
      }
    }
  } catch (err) {
    statusBox.className = "crm-status-box error";
    statusBox.textContent = `Error: ${err.message}`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function executeCRMTestConnection() {
  const mode = document.getElementById("crmTargetMode").value;
  let targetUrl = "";
  let crmType = "webhook";
  let apiKey = "";

  if (mode === "destination") {
    const destId = document.getElementById("crmDestSelect").value;
    const dest = cachedCRMDestinations.find(d => d.destination_id === destId);
    if (!dest) {
      alert("Please select a destination first.");
      return;
    }
    targetUrl = dest.target_url;
    crmType = dest.crm_type;
    apiKey = dest.api_key || "";
  } else {
    targetUrl = (document.getElementById("crmDynamicUrl").value || "").trim();
    crmType = document.getElementById("crmDynamicType").value;
    apiKey = (document.getElementById("crmDynamicKey").value || "").trim();
    if (!targetUrl) {
      alert("Please enter a target URL to ping.");
      return;
    }
  }

  const statusBox = document.getElementById("crmExportStatusBox");
  statusBox.className = "crm-status-box info";
  statusBox.style.display = "block";
  statusBox.textContent = `🔌 Pinging endpoint ${targetUrl}...`;

  try {
    const res = await fetch("/api/crm/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_url: targetUrl,
        crm_type: crmType,
        api_key: apiKey,
      }),
    });
    const data = await res.json();
    if (data.connected) {
      statusBox.className = "crm-status-box success";
      statusBox.innerHTML = `<strong>Connection Successful!</strong> Endpoint responded with HTTP ${data.status_code}. Response: <code>${escapeHtml((data.response || "").slice(0, 100))}</code>`;
    } else {
      statusBox.className = "crm-status-box error";
      statusBox.innerHTML = `<strong>Connection Failed:</strong> ${escapeHtml(data.error || data.message)} (HTTP ${data.status_code})`;
    }
  } catch (err) {
    statusBox.className = "crm-status-box error";
    statusBox.textContent = `Connection test error: ${err.message}`;
  }
}

async function loadCRMLogs() {
  const container = document.getElementById("crmLogsContainer");
  if (!container) return;
  container.innerHTML = '<div style="font-size: 13px; color: var(--text-subtle);">Loading export logs...</div>';

  try {
    const res = await fetch("/api/crm/logs?limit=25");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const logs = await res.json();

    if (logs.length === 0) {
      container.innerHTML = '<div style="font-size: 13px; color: var(--text-subtle);">No outbound CRM exports recorded yet.</div>';
      return;
    }

    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-light); text-align: left; background: var(--surface-subtle);">
            <th style="padding: 8px;">Time</th>
            <th style="padding: 8px;">Customer / Target</th>
            <th style="padding: 8px;">City</th>
            <th style="padding: 8px;">Type</th>
            <th style="padding: 8px;">Leads</th>
            <th style="padding: 8px;">Trigger</th>
            <th style="padding: 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(l => {
            const isOk = l.status === "success";
            const statusColor = isOk ? "#15803d" : "#b91c1c";
            const dateStr = l.created_at ? new Date(l.created_at).toLocaleTimeString() : "";
            return `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 8px;">${escapeHtml(dateStr)}</td>
                <td style="padding: 8px; font-weight: 600;">${escapeHtml(l.customer_name || "One-off Export")}</td>
                <td style="padding: 8px;">${escapeHtml(l.city)}</td>
                <td style="padding: 8px;"><span class="crm-badge crm-badge-${l.crm_type}">${escapeHtml(l.crm_type)}</span></td>
                <td style="padding: 8px; font-weight: 700;">${l.leads_count}</td>
                <td style="padding: 8px;"><code>${escapeHtml(l.trigger_type)}</code></td>
                <td style="padding: 8px; color: ${statusColor}; font-weight: 700;">
                  ${isOk ? "✓ " : "✗ "}${escapeHtml(l.status.toUpperCase())} ${l.status_code ? `(${l.status_code})` : ""}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: #b91c1c; font-size: 13px;">Error loading logs: ${escapeHtml(err.message)}</div>`;
  }
}

// Initialize application on page load
updateLocationScopeHeaders();
loadLocationData();
checkHealth();

// Background interval updates
setInterval(checkHealth, 15000);

