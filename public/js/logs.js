const API_BASE = "/api";
const TOKEN_KEY = "lucianToken";
const API_KEY_KEY = "lucianApiKey";
const SELECTED_PROJECT_KEY = "lucianLogsSelectedProject";

const logsContainer = document.getElementById("logsContainer");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const levelFilter = document.getElementById("levelFilter");
const statusFilter = document.getElementById("statusFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

function getApiKey() {
  return localStorage.getItem(API_KEY_KEY);
}

function requireProjectAccess() {
  const apiKey = getApiKey();
  if (!apiKey) {
    logsContainer.innerHTML = "<p>No active project API key found. Please select or create a project.</p>";
    return null;
  }
  return apiKey;
}

async function apiRequest(endpoint, options = {}) {
  const apiKey = requireProjectAccess();
  if (!apiKey) return null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      "x-api-key": apiKey
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem(API_KEY_KEY);
    localStorage.removeItem(SELECTED_PROJECT_KEY);
    logsContainer.innerHTML = "<p>Project access expired or invalid. Please select a project again.</p>";
    return null;
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function renderLogs(logs) {
  if (!logs || !logs.length) {
    logsContainer.innerHTML = "<p>No logs available.</p>";
    return;
  }

  logsContainer.innerHTML = logs
    .map((log) => `
      <div class="log-row">
        <span class="log-level ${log.level || "info"}">${escapeHtml(log.level || "info")}</span>
        <div class="log-message">
          <strong>${escapeHtml(log.message || "Untitled log")}</strong>
          <span>${escapeHtml(log.method || "")} ${escapeHtml(log.endpoint || "")}</span>
        </div>
        <span class="status-code">${log.statusCode || "—"}</span>
      </div>
    `)
    .join("");
}

function getFilterParams() {
  const params = new URLSearchParams();
  params.set("limit", "50");

  const level = levelFilter?.value?.trim();
  const statusCode = statusFilter?.value?.trim();
  const search = searchInput?.value?.trim();

  if (level) params.set("level", level);
  if (statusCode) params.set("statusCode", statusCode);
  if (search) params.set("search", search);

  return params;
}

async function loadLogs() {
  try {
    const projectId = localStorage.getItem(SELECTED_PROJECT_KEY) || localStorage.getItem("lucianProjectId");
    if (!projectId) {
      logsContainer.innerHTML = "<p>Select a project to view logs.</p>";
      return;
    }

    const queryString = getFilterParams().toString();
    const data = await apiRequest(`/logs?${queryString}`);
    if (!data) return;
    renderLogs(data.logs || []);
  } catch (error) {
    console.error("Failed to load logs:", error);
    logsContainer.innerHTML = `<p>Failed to load logs.</p>`;
  }
}

async function refreshLogs() {
  refreshBtn.textContent = "Refreshing...";
  refreshBtn.disabled = true;
  await loadLogs();
  refreshBtn.textContent = "Refresh";
  refreshBtn.disabled = false;
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(API_KEY_KEY);
  localStorage.removeItem(SELECTED_PROJECT_KEY);
  localStorage.removeItem("lucianProjectId");
  window.location.href = "/login.html";
});

refreshBtn.addEventListener("click", refreshLogs);

applyFiltersBtn?.addEventListener("click", () => {
  loadLogs();
});

clearFiltersBtn?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (levelFilter) levelFilter.value = "";
  if (statusFilter) statusFilter.value = "";
  loadLogs();
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadLogs();
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (localStorage.getItem(TOKEN_KEY)) {
  loadLogs();
} else {
  logsContainer.innerHTML = "<p>Please log in to continue.</p>";
}
