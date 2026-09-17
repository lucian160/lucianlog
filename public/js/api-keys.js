const TOKEN_KEY = "lucianToken";
const SELECTED_PROJECT_KEY = "lucianLogsSelectedProject";
const PROJECT_ID_KEY = "lucianProjectId";
const API_KEY_KEY = "lucianApiKey";

const projectApiKeyValue = document.getElementById("projectApiKeyValue");
const projectApiKeyLabel = document.getElementById("projectApiKeyLabel");
const copyKeyBtn = document.getElementById("copyKeyBtn");
const logoutBtn = document.getElementById("logoutBtn");

function requireToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = "/login.html";
    return null;
  }
  return token;
}

async function apiRequest(endpoint, options = {}) {
  const token = requireToken();
  if (!token) return null;

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login.html";
    return null;
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function loadSelectedProjectKey() {
  const projectId = localStorage.getItem(SELECTED_PROJECT_KEY) || localStorage.getItem(PROJECT_ID_KEY);
  if (!projectId) {
    projectApiKeyLabel.textContent = "No project selected";
    projectApiKeyValue.textContent = "Select a project to view or generate an API key.";
    return;
  }

  try {
    const data = await apiRequest(`/projects/${projectId}`);
    if (!data) return;

    projectApiKeyLabel.textContent = data.project.name;
    const savedKey = localStorage.getItem(API_KEY_KEY);

    if (savedKey) {
      projectApiKeyValue.textContent = savedKey;
      return;
    }

    projectApiKeyValue.textContent = "Create or regenerate the project key to display it here.";
  } catch (error) {
    projectApiKeyLabel.textContent = "Unable to load project";
    projectApiKeyValue.textContent = error.message;
  }
}

copyKeyBtn.addEventListener("click", async () => {
  const projectId = localStorage.getItem(SELECTED_PROJECT_KEY) || localStorage.getItem(PROJECT_ID_KEY);
  if (!projectId) {
    alert("Select a project first.");
    return;
  }

  const key = localStorage.getItem(API_KEY_KEY);
  if (!key) {
    alert("No API key has been saved for this project yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(key);
    copyKeyBtn.textContent = "Copied!";
    setTimeout(() => (copyKeyBtn.textContent = "Copy"), 1500);
  } catch (error) {
    alert("Could not copy the API key. Please copy it manually.");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SELECTED_PROJECT_KEY);
  window.location.href = "/login.html";
});

if (!requireToken()) {
  throw new Error("Authentication required");
}

loadSelectedProjectKey();
