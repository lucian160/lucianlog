const API_BASE = "/api";
const TOKEN_KEY = "lucianToken";
const logoutBtn = document.getElementById("logoutBtn");
const pendingApprovalsEl = document.getElementById("pendingApprovals");
const errorWatchCountEl = document.getElementById("errorWatchCount");
const firewallStateEl = document.getElementById("firewallState");
const summaryStatusEl = document.getElementById("summaryStatus");
const approvalRequestsEl = document.getElementById("approvalRequests");
const firewallHistoryEl = document.getElementById("firewallHistory");
const recentErrorsEl = document.getElementById("recentErrors");
const userAccessListEl = document.getElementById("userAccessList");
const notificationForm = document.getElementById("notificationForm");
const notificationEmailInput = document.getElementById("notificationEmail");
const notificationTitleInput = document.getElementById("notificationTitle");
const notificationMessageInput = document.getElementById("notificationMessage");
const notificationStatusEl = document.getElementById("notificationStatus");

function requireToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = "/login.html";
    return null;
  }
  return token;
}

async function apiRequest(endpoint) {
  const token = requireToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function renderApprovalRequests(requests) {
  if (!requests || !requests.length) {
    approvalRequestsEl.innerHTML = "<p>No firewall approval requests pending.</p>";
    return;
  }

  approvalRequestsEl.innerHTML = requests.map((request) => `
    <div class="log-item">
      <div>
        <strong>${request.ip || "Unknown IP"}</strong>
        <p>${request.note || "Request waiting for manual approval"}</p>
      </div>
      <div>
        <button class="primary-btn" data-approve-id="${request.id || request.ip}">Approve</button>
        <button class="secondary-btn" data-reject-id="${request.id || request.ip}">Reject</button>
      </div>
    </div>
  `).join("");

  approvalRequestsEl.querySelectorAll("[data-approve-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-approve-id");
      try {
        await apiRequest(`/admin/firewall/approve/${encodeURIComponent(id)}`);
        await loadAdminData();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  approvalRequestsEl.querySelectorAll("[data-reject-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-reject-id");
      const reason = window.prompt("Why is this firewall request being rejected?");

      if (reason === null) {
        return;
      }

      try {
        await fetch(`${API_BASE}/admin/firewall/reject/${encodeURIComponent(id)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${requireToken()}`
          },
          body: JSON.stringify({ reason: reason.trim() || "Rejected by administrator" })
        }).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.message || "Rejection failed");
          }
          return data;
        });
        await loadAdminData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderRecentErrors(errors) {
  if (!errors || !errors.length) {
    recentErrorsEl.innerHTML = "<p>No recent errors reported by Lucian Logs.</p>";
    return;
  }

  recentErrorsEl.innerHTML = errors.map((error) => `
    <div class="log-item">
      <div>
        <strong>${error.level || "error"}</strong>
        <p>${error.message || "Unknown error"}</p>
      </div>
      <span class="log-level error">${error.statusCode || "ERR"}</span>
    </div>
  `).join("");
}

function renderUserAccess(users) {
  if (!users || !users.length) {
    userAccessListEl.innerHTML = "<p>No users found.</p>";
    return;
  }

  userAccessListEl.innerHTML = users.map((user) => `
    <div class="log-item">
      <div>
        <strong>${user.name || "Unknown user"}</strong>
        <p>${user.email || "No email"}</p>
      </div>
      <div>
        <select data-user-role-id="${user.id || user._id}">
          <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </div>
    </div>
  `).join("");

  userAccessListEl.querySelectorAll("[data-user-role-id]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const userId = event.target.getAttribute("data-user-role-id");
      const newRole = event.target.value;

      try {
        const response = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${requireToken()}`
          },
          body: JSON.stringify({ role: newRole })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Failed to update user role");
        }

        await loadAdminData();
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function renderFirewallHistory(history) {
  if (!history || !history.length) {
    firewallHistoryEl.innerHTML = "<p>No recent firewall activity.</p>";
    return;
  }

  firewallHistoryEl.innerHTML = history.map((item) => `
    <div class="log-item">
      <div>
        <strong>${item.ip || "Unknown IP"}</strong>
        <p>${item.note || "No note provided"}</p>
      </div>
      <div>
        <span class="log-level ${item.status === "approved" ? "info" : "warn"}">${item.status || "updated"}</span>
      </div>
    </div>
  `).join("");
}

async function loadAdminData() {
  try {
    const firewallData = await apiRequest("/auth/firewall-status");
    const adminData = await apiRequest("/admin/summary");
    const usersData = await apiRequest("/admin/users");

    const firewall = firewallData?.firewall || {};
    const summary = adminData || {};
    const users = usersData?.users || [];

    pendingApprovalsEl.textContent = String(summary.pendingCount || 0);
    errorWatchCountEl.textContent = String(summary.errorCount || 0);
    firewallStateEl.textContent = firewall.enabled ? "Enabled" : "Disabled";
    summaryStatusEl.textContent = summary.hasAction ? "Action needed" : "Healthy";

    renderApprovalRequests(summary.pendingRequests || []);
    renderFirewallHistory(summary.firewallHistory || []);
    renderRecentErrors(summary.recentErrors || []);
    renderUserAccess(users);
  } catch (error) {
    approvalRequestsEl.innerHTML = `<p>${error.message}</p>`;
    firewallHistoryEl.innerHTML = "<p>Could not load firewall history.</p>";
    recentErrorsEl.innerHTML = "<p>Could not load admin summary.</p>";
    userAccessListEl.innerHTML = "<p>Could not load users.</p>";
  }
}

notificationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = notificationEmailInput.value.trim();
  const title = notificationTitleInput.value.trim();
  const message = notificationMessageInput.value.trim();
  const channels = [];

  if (document.querySelector('input[name="channelEmail"]').checked) channels.push("email");
  if (document.querySelector('input[name="channelInApp"]').checked) channels.push("in_app");

  if (!title || !message) {
    notificationStatusEl.textContent = "Title and message are required.";
    notificationStatusEl.style.color = "#b91c1c";
    return;
  }

  if (!email && channels.length === 0) {
    notificationStatusEl.textContent = "Choose at least one channel and provide a target user or email.";
    notificationStatusEl.style.color = "#b91c1c";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${requireToken()}`
      },
      body: JSON.stringify({ email, title, message, channels })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to send notification");
    }

    notificationStatusEl.textContent = data.message || "Notification sent successfully.";
    notificationStatusEl.style.color = "#166534";
    notificationForm.reset();
  } catch (error) {
    notificationStatusEl.textContent = error.message;
    notificationStatusEl.style.color = "#b91c1c";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/login.html";
});

loadAdminData();
