const TOKEN_KEY = "lucianToken";
const logoutBtn = document.getElementById("logoutBtn");
const accountInfo = document.getElementById("accountInfo");
const firewallInfo = document.getElementById("firewallInfo");
const firewallRequestForm = document.getElementById("firewallRequestForm");
const requestedIpInput = document.getElementById("requestedIp");
const requestNoteInput = document.getElementById("requestNote");
const requestStatusEl = document.getElementById("requestStatus");

function requireToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = "/login.html";
    return null;
  }
  return token;
}

async function loadAccount() {
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load account");
    }

    const user = data.user;
    const roleLabel = user.role === "admin" ? "Admin" : "User";
    const roleClass = user.role === "admin" ? "warn" : "info";

    accountInfo.innerHTML = `
      <div class="log-item">
        <div>
          <strong>${escapeHtml(user.name || "User")}</strong>
          <p>${escapeHtml(user.email || "No email")}</p>
          <p><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>
        </div>
        <span class="log-level ${roleClass}">${roleLabel}</span>
      </div>
    `;
  } catch (error) {
    accountInfo.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

async function loadFirewallStatus() {
  try {
    const response = await fetch("/api/auth/firewall-status", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load firewall status");
    }

    const firewall = data.firewall || {};
    const ips = Array.isArray(firewall.allowedIps) ? firewall.allowedIps : [];
    const enabled = Boolean(firewall.enabled);

    firewallInfo.innerHTML = `
      <div class="log-item">
        <div>
          <strong>${enabled ? "Firewall enabled" : "Firewall disabled"}</strong>
          <p>${enabled ? "Approved access requires a trusted IP and developer approval." : "No IP restriction is currently enforced."}</p>
          <p><strong>Header:</strong> ${escapeHtml(firewall.header || "x-lucian-approval")}</p>
          <p><strong>Allowed IPs:</strong> ${ips.length ? escapeHtml(ips.join(", ")) : "None configured"}</p>
        </div>
        <span class="log-level ${enabled ? "warn" : "info"}">${enabled ? "Protected" : "Off"}</span>
      </div>
    `;
  } catch (error) {
    firewallInfo.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

firewallRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ip = requestedIpInput.value.trim();
  const note = requestNoteInput.value.trim();

  if (!ip) {
    requestStatusEl.textContent = "Please enter an IP address.";
    requestStatusEl.style.color = "#b91c1c";
    return;
  }

  try {
    const response = await fetch("/api/admin/firewall/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`
      },
      body: JSON.stringify({ ip, note })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit firewall request");
    }

    requestStatusEl.textContent = data.message || "Firewall approval request submitted.";
    requestStatusEl.style.color = "#166534";
    firewallRequestForm.reset();
    await loadFirewallStatus();
  } catch (error) {
    requestStatusEl.textContent = error.message;
    requestStatusEl.style.color = "#b91c1c";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("lucianUser");
  window.location.href = "/login.html";
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (!requireToken()) {
  throw new Error("Authentication required");
}

loadAccount();
loadFirewallStatus();
