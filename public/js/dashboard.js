const API_BASE = "/api";

const projectId = localStorage.getItem("lucianProjectId");
const token = localStorage.getItem("lucianToken");

const totalLogsEl = document.getElementById("totalLogs");
const errorCountEl = document.getElementById("errorCount");
const warningCountEl = document.getElementById("warningCount");
const errorRateEl = document.getElementById("errorRate");

const latestLogEl = document.getElementById("latestLog");
const logsContainerEl = document.getElementById("logsContainer");
const notificationInboxEl = document.getElementById("notificationInbox");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");


/*API REQUEST*/

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,

    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}


/*LOAD SUMMARY*/

async function loadSummary() {
  try {
    const data = await apiRequest(`/logs/summary?projectId=${encodeURIComponent(projectId)}`);

    totalLogsEl.textContent = data.totalLogs;
    errorCountEl.textContent = data.errors;
    warningCountEl.textContent = data.warnings;

    errorRateEl.textContent =
      `${data.errorRate}%`;

    renderLatestLog(data.latestLog);

  } catch (error) {
    console.error("❌ Failed to load summary:", error);

    latestLogEl.innerHTML = `
      <p>Failed to load dashboard data.</p>
    `;
  }
}


/*LATEST LOG*/

function renderLatestLog(log) {

  if (!log) {
    latestLogEl.innerHTML = `
      <p>No logs received yet.</p>
    `;

    return;
  }

  latestLogEl.innerHTML = `
    <div class="log-item">
      <div>
        <strong>${escapeHtml(log.message)}</strong>

        <p>
          ${escapeHtml(log.method || "UNKNOWN")}
          ${escapeHtml(log.endpoint || "")}
        </p>
      </div>

      <span class="log-level ${log.level}">
        ${escapeHtml(log.level)}
      </span>
    </div>
  `;
}


/*LOAD LOGS*/

async function loadLogs() {

  try {

    const data = await apiRequest(`/logs?projectId=${encodeURIComponent(projectId)}&limit=10`);

    renderLogs(data.logs);

  } catch (error) {

    console.error("❌ Failed to load logs:", error);

    logsContainerEl.innerHTML = `
      <p>Failed to load logs.</p>
    `;
  }
}

async function loadNotifications() {
  try {
    const token = localStorage.getItem("lucianToken");
    if (!token) {
      notificationInboxEl.innerHTML = "<p>Please log in to view notifications.</p>";
      return;
    }

    const response = await fetch(`${API_BASE}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to load notifications");

    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    if (!notifications.length) {
      notificationInboxEl.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    notificationInboxEl.innerHTML = notifications.map((notification) => `
      <div class="log-item" data-notification-id="${notification.id}">
        <div>
          <strong>${escapeHtml(notification.title || "Notification")}</strong>
          <p>${escapeHtml(notification.message || "No message")}</p>
        </div>
        <div>
          <span class="log-level ${notification.unread ? "warn" : "info"}">${notification.unread ? "Unread" : "Read"}</span>
          ${notification.unread ? '<button class="secondary-btn" data-mark-read="' + notification.id + '">Mark read</button>' : ""}
        </div>
      </div>
    `).join("");

    notificationInboxEl.querySelectorAll("[data-mark-read]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-mark-read");
        try {
          const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("lucianToken")}`
            }
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.message || "Failed to mark notification as read");

          await loadNotifications();
        } catch (error) {
          console.error("❌ Failed to mark notification as read:", error);
        }
      });
    });
  } catch (error) {
    console.error("❌ Failed to load notifications:", error);
    notificationInboxEl.innerHTML = "<p>Could not load notifications.</p>";
  }
}


/*RENDER LOGS*/

function renderLogs(logs) {

  if (!logs.length) {

    logsContainerEl.innerHTML = `
      <p>No logs available.</p>
    `;

    return;
  }

  logsContainerEl.innerHTML = logs.map(log => {

    return `
      <div class="log-row">

        <span class="log-level ${log.level}">
          ${escapeHtml(log.level)}
        </span>

        <div class="log-message">
          <strong>
            ${escapeHtml(log.message)}
          </strong>

          <span>
            ${escapeHtml(log.method || "")}
            ${escapeHtml(log.endpoint || "")}
          </span>
        </div>

        <span class="status-code">
          ${log.statusCode || "—"}
        </span>

      </div>
    `;

  }).join("");
}


/*REFRESH*/

async function refreshDashboard() {

  refreshBtn.textContent = "Refreshing...";

  refreshBtn.disabled = true;

  await Promise.all([
    loadSummary(),
    loadLogs(),
    loadNotifications()
  ]);

  refreshBtn.textContent = "Refresh";

  refreshBtn.disabled = false;
}


/*LOGOUT*/

logoutBtn.addEventListener("click", () => {

  localStorage.removeItem("lucianProjectId");
  localStorage.removeItem("lucianApiKey");
  localStorage.removeItem("lucianToken");

  window.location.href = "/login.html";
});


/*REFRESH BUTTON*/

refreshBtn.addEventListener(
  "click",
  refreshDashboard
);


/*HTML ESCAPE*/

function escapeHtml(value) {

  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}


/* INITIAL LOAD */
if (!projectId || !token) {

  latestLogEl.innerHTML = `
    <p>
      No project selected.
      Please select a project first.
    </p>
  `;

} else {

  refreshDashboard();
}