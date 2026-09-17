const API_BASE = "/api";

const TOKEN_KEY = "lucianToken";
const SELECTED_PROJECT_KEY = "lucianLogsSelectedProject";
const PROJECT_ID_KEY = "lucianProjectId";
const API_KEY_KEY = "lucianApiKey";

const createProjectBtn =
  document.getElementById("createProjectBtn");

const emptyCreateBtn =
  document.getElementById("emptyCreateBtn");

const projectModal =
  document.getElementById("projectModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const cancelBtn =
  document.getElementById("cancelBtn");

const modalOverlay =
  document.querySelector(".modal-overlay");

const projectForm =
  document.getElementById("projectForm");

const projectsContainer =
  document.getElementById("projectsContainer");

const emptyState =
  document.getElementById("emptyState");

const projectCount =
  document.getElementById("projectCount");

const activeProjectName =
  document.getElementById("activeProjectName");

const logoutBtn =
  document.getElementById("logoutBtn");

// Authentication

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function requireToken() {
  const token = getToken();

  if (!token) {
    window.location.href = "/login.html";
    return null;
  }

  return token;
}

// API Request

async function apiRequest(endpoint, options = {}) {
  const token = requireToken();

  if (!token) {
    return null;
  }

  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SELECTED_PROJECT_KEY);

    window.location.href = "/login.html";

    return null;
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
}

// Selected Project

function getSelectedProjectId() {
  return localStorage.getItem(
    SELECTED_PROJECT_KEY
  ) || localStorage.getItem(PROJECT_ID_KEY);
}

function setSelectedProjectId(id) {
  localStorage.setItem(
    SELECTED_PROJECT_KEY,
    id
  );
  localStorage.setItem(
    PROJECT_ID_KEY,
    id
  );
}

function clearSelectedProject() {
  localStorage.removeItem(
    SELECTED_PROJECT_KEY
  );
  localStorage.removeItem(
    PROJECT_ID_KEY
  );
  localStorage.removeItem(
    API_KEY_KEY
  );
}

// Modal

function openModal() {
  projectModal.classList.remove("hidden");

  setTimeout(() => {
    const input =
      document.getElementById("projectName");

    if (input) {
      input.focus();
    }
  }, 50);
}

function closeModal() {
  projectModal.classList.add("hidden");
  projectForm.reset();
}

createProjectBtn.addEventListener(
  "click",
  openModal
);

emptyCreateBtn.addEventListener(
  "click",
  openModal
);

closeModalBtn.addEventListener(
  "click",
  closeModal
);

cancelBtn.addEventListener(
  "click",
  closeModal
);

modalOverlay.addEventListener(
  "click",
  closeModal
);

// Load Projects

async function loadProjects() {
  try {
    const data = await apiRequest(
      "/projects"
    );

    if (!data) {
      return;
    }

    renderProjects(
      data.projects || []
    );

  } catch (error) {
    console.error(
      "Failed to load projects:",
      error
    );

    projectsContainer.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">!</div>

        <h3>
          Failed to load projects
        </h3>

        <p>
          ${escapeHtml(error.message)}
        </p>

        <button
          class="primary-btn"
          id="retryProjectsBtn"
        >
          Try Again
        </button>

      </div>
    `;

    const retryBtn =
      document.getElementById(
        "retryProjectsBtn"
      );

    if (retryBtn) {
      retryBtn.addEventListener(
        "click",
        loadProjects
      );
    }
  }
}

// Create Project

projectForm.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();

    const name =
      document
        .getElementById("projectName")
        .value
        .trim();

    if (!name) {
      return;
    }

    const submitBtn =
      projectForm.querySelector(
        'button[type="submit"]'
      );

    submitBtn.disabled = true;
    submitBtn.textContent =
      "Creating...";

    try {
      const data =
        await apiRequest(
          "/projects",
          {
            method: "POST",

            body: JSON.stringify({
              name
            })
          }
        );

      if (!data) {
        return;
      }

      const project =
        data.project;

      if (project.apiKey) {
        localStorage.setItem(
          API_KEY_KEY,
          project.apiKey
        );
      }

      setSelectedProjectId(
        project.id
      );

      closeModal();

      showApiKeyModal(
        project
      );

      await loadProjects();

    } catch (error) {
      console.error(
        "Failed to create project:",
        error
      );

      alert(
        error.message
      );

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent =
        "Create Project";
    }
  }
);

// Select Project

async function selectProject(
  projectId
) {
  setSelectedProjectId(
    projectId
  );

  const selectedProject =
    (await getProjectsFromServer()).find(
      (project) =>
        String(project.id) === String(projectId)
    );

  if (selectedProject?.apiKey) {
    localStorage.setItem(
      API_KEY_KEY,
      selectedProject.apiKey
    );
  }

  await loadProjects();
}

// Delete Project

async function deleteProject(
  projectId
) {
  const projects =
    await getProjectsFromServer();

  const project =
    projects.find(
      item =>
        String(item.id) ===
        String(projectId)
    );

  if (!project) {
    return;
  }

  const confirmed =
    confirm(
      `Delete "${project.name}"?\n\nAll logs belonging to this project will also be deleted. This cannot be undone.`
    );

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(
      `/projects/${projectId}`,
      {
        method: "DELETE"
      }
    );

    if (
      String(
        getSelectedProjectId()
      ) === String(projectId)
    ) {
      clearSelectedProject();
    }

    await loadProjects();

  } catch (error) {
    console.error(
      "Failed to delete project:",
      error
    );

    alert(
      error.message
    );
  }
}

// Get Projects From Server

async function getProjectsFromServer() {
  const data =
    await apiRequest(
      "/projects"
    );

  return data?.projects || [];
}

// Activate / Deactivate

async function toggleProject(
  projectId,
  isActive
) {
  const action =
    isActive
      ? "deactivate"
      : "activate";

  try {
    await apiRequest(
      `/projects/${projectId}/${action}`,
      {
        method: "PATCH"
      }
    );

    await loadProjects();

  } catch (error) {
    console.error(
      "Failed to change project status:",
      error
    );

    alert(
      error.message
    );
  }
}

// Regenerate API Key

async function regenerateApiKey(
  projectId,
  projectName
) {
  const confirmed =
    confirm(
      `Regenerate the API key for "${projectName}"?\n\nThe old API key will immediately stop working.`
    );

  if (!confirmed) {
    return;
  }

  try {
    const data =
      await apiRequest(
        `/projects/${projectId}/regenerate-key`,
        {
          method: "POST"
        }
      );

    if (!data) {
      return;
    }

    if (data.project?.apiKey) {
      localStorage.setItem(
        API_KEY_KEY,
        data.project.apiKey
      );
    }

    setSelectedProjectId(
      projectId
    );

    showApiKeyModal(
      data.project
    );

  } catch (error) {
    console.error(
      "Failed to regenerate API key:",
      error
    );

    alert(
      error.message
    );
  }
}

// Render Projects

function renderProjects(
  projects
) {
  const selectedId =
    getSelectedProjectId();

  projectCount.textContent =
    projects.length;

  let selectedProject =
    projects.find(
      project =>
        String(project.id) ===
        String(selectedId)
    );

  if (
    !selectedProject &&
    projects.length > 0
  ) {
    selectedProject =
      projects[0];

    setSelectedProjectId(
      selectedProject.id
    );
  }

  if (selectedProject && !localStorage.getItem(API_KEY_KEY)) {
    localStorage.setItem(
      API_KEY_KEY,
      ""
    );
  }

  activeProjectName.textContent =
    selectedProject
      ? selectedProject.name
      : "None";

  if (projects.length === 0) {
    emptyState.style.display =
      "flex";

    projectsContainer.innerHTML = "";

    projectsContainer.appendChild(
      emptyState
    );

    return;
  }

  emptyState.style.display =
    "none";

  projectsContainer.innerHTML =
    projects
      .map(project => {
        const selected =
          String(project.id) ===
          String(
            getSelectedProjectId()
          );

        const createdDate =
          new Date(
            project.createdAt
          ).toLocaleDateString(
            undefined,
            {
              year: "numeric",
              month: "short",
              day: "numeric"
            }
          );

        const status =
          project.active
            ? "Active"
            : "Inactive";

        return `
          <div
            class="project-card ${
              selected
                ? "selected"
                : ""
            }"
          >

            <div class="project-info">

              <div class="project-title">

                <h3>
                  ${escapeHtml(
                    project.name
                  )}
                </h3>

                ${
                  selected
                    ? `
                      <span class="selected-badge">
                        Selected
                      </span>
                    `
                    : ""
                }

              </div>

              <p class="project-description">

                <span
                  class="project-status ${
                    project.active
                      ? "active"
                      : "inactive"
                  }"
                >
                  ${status}
                </span>

              </p>

              <span class="project-meta">
                Created ${createdDate}
              </span>

            </div>

            <div class="project-actions">

              ${
                selected
                  ? `
                    <button
                      class="select-btn"
                      disabled
                    >
                      Selected
                    </button>
                  `
                  : `
                    <button
                      class="select-btn"
                      data-action="select"
                      data-id="${project.id}"
                    >
                      Select
                    </button>
                  `
              }

              <button
                class="select-btn"
                data-action="toggle"
                data-id="${project.id}"
                data-active="${project.active}"
              >
                ${
                  project.active
                    ? "Deactivate"
                    : "Activate"
                }
              </button>

              <button
                class="select-btn"
                data-action="regenerate"
                data-id="${project.id}"
                data-name="${escapeHtml(
                  project.name
                )}"
              >
                Regenerate Key
              </button>

              <button
                class="delete-btn"
                data-action="delete"
                data-id="${project.id}"
              >
                Delete
              </button>

            </div>

          </div>
        `;
      })
      .join("");
}

// Project Button Events

projectsContainer.addEventListener(
  "click",
  function (event) {
    const button =
      event.target.closest(
        "button[data-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset.action;

    const id =
      button.dataset.id;

    if (action === "select") {
      selectProject(id);
    }

    if (action === "delete") {
      deleteProject(id);
    }

    if (action === "toggle") {
      toggleProject(
        id,
        button.dataset.active ===
          "true"
      );
    }

    if (action === "regenerate") {
      regenerateApiKey(
        id,
        button.dataset.name
      );
    }
  }
);

// API Key Modal

function showApiKeyModal(
  project
) {
  const existing =
    document.getElementById(
      "apiKeyModal"
    );

  if (existing) {
    existing.remove();
  }

  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "apiKeyModal";

  modal.className =
    "modal";

  modal.innerHTML = `
    <div class="modal-overlay"></div>

    <div class="modal-content">

      <div class="modal-header">

        <div>

          <p class="eyebrow">
            API KEY
          </p>

          <h2>
            ${escapeHtml(
              project.name
            )}
          </h2>

        </div>

      </div>

      <div class="api-key-warning">

        <strong>
          Save this API key now.
        </strong>

        <p>
          You will not be able to view
          this key again.
        </p>

      </div>

      <div class="api-key-box">

        <code id="generatedApiKey">
          ${escapeHtml(
            project.apiKey
          )}
        </code>

        <button
          id="copyApiKeyBtn"
          class="secondary-btn"
        >
          Copy
        </button>

      </div>

      <div class="modal-actions">

        <button
          id="closeApiKeyBtn"
          class="primary-btn"
        >
          I've saved it
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  const overlay =
    modal.querySelector(
      ".modal-overlay"
    );

  const closeBtn =
    document.getElementById(
      "closeApiKeyBtn"
    );

  const copyBtn =
    document.getElementById(
      "copyApiKeyBtn"
    );

  function closeApiKeyModal() {
    modal.remove();
  }

  overlay.addEventListener(
    "click",
    closeApiKeyModal
  );

  closeBtn.addEventListener(
    "click",
    closeApiKeyModal
  );

  copyBtn.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(
          project.apiKey
        );

        copyBtn.textContent =
          "Copied!";

        setTimeout(() => {
          copyBtn.textContent =
            "Copy";
        }, 1500);

      } catch (error) {
        alert(
          "Could not copy the API key. Please copy it manually."
        );
      }
    }
  );
}

// Logout

logoutBtn.addEventListener(
  "click",
  function () {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      "lucianUser"
    );

    clearSelectedProject();

    window.location.href =
      "/login.html";
  }
);

// HTML Safety

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Initial Load

if (!requireToken()) {
  throw new Error(
    "Authentication required"
  );
}

loadProjects();