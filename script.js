
"use strict";

// ======================================
// CivicFix AI - Complaint Management
// ======================================

const form = document.getElementById("complaintForm");
const descriptionInput = document.getElementById("description");
const locationInput = document.getElementById("location");
const complaintList = document.getElementById("complaintList");
const message = document.getElementById("message");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const totalComplaints = document.getElementById("totalComplaints");
const submittedCount = document.getElementById("submittedCount");
const progressCount = document.getElementById("progressCount");
const resolvedCount = document.getElementById("resolvedCount");

const STORAGE_KEY = "civicfixComplaints";
const VALID_STATUSES = ["Submitted", "In Progress", "Resolved"];

function loadComplaints() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

let complaints = loadComplaints();

// --------------------------------------
// Save complaints
// --------------------------------------

function saveComplaints() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    return true;
  } catch (error) {
    showMessage("Could not save complaint data.", true);
    return false;
  }
}

// --------------------------------------
// Feedback message
// --------------------------------------

function showMessage(text, isError = false) {
  if (!message) return;

  message.textContent = text;
  message.style.color = isError ? "#c62828" : "#087f5b";
}

// --------------------------------------
// Complaint analysis
// --------------------------------------

function analyzeComplaint(description) {
  const text = description.toLowerCase();

  let category = "Other";
  let priority = "Low";

  if (/fire|accident|ambulance|emergency|electric shock|danger/.test(text)) {
    category = "Emergency";
    priority = "High";
  } else if (/water|leak|pipe|drainage|sewage|tap/.test(text)) {
    category = "Water";
  } else if (/street ?light|streetlight|electricity|power cut|dark road/.test(text)) {
    category = "Streetlight";
  } else if (/garbage|waste|rubbish|dustbin|dirty|litter/.test(text)) {
    category = "Garbage";
  } else if (/road|pothole|traffic|footpath|pavement/.test(text)) {
    category = "Road";
  }

  if (/urgent|overflow|burst pipe|electric shock|fire|accident|danger|emergency/.test(text)) {
    priority = "High";
  } else if (/broken|not working|leak|blocked|damaged|dirty|pothole/.test(text)) {
    priority = "Medium";
  }

  return { category, priority };
}

// --------------------------------------
// Status colors
// --------------------------------------

function applyStatusStyle(select) {
  const colors = {
    "Submitted": {
      background: "#dbeafe",
      color: "#1d4ed8"
    },
    "In Progress": {
      background: "#ffedd5",
      color: "#c2410c"
    },
    "Resolved": {
      background: "#dcfce7",
      color: "#15803d"
    }
  };

  const style = colors[select.value] || colors.Submitted;

  select.style.backgroundColor = style.background;
  select.style.color = style.color;
  select.style.fontWeight = "600";
  select.style.borderRadius = "8px";
  select.style.padding = "8px 12px";
}

// --------------------------------------
// Dashboard counters
// --------------------------------------

function updateDashboard() {
  const total = complaints.length;

  const submitted = complaints.filter(
    item => (item.status || "Submitted") === "Submitted"
  ).length;

  const inProgress = complaints.filter(
    item => item.status === "In Progress"
  ).length;

  const resolved = complaints.filter(
    item => item.status === "Resolved"
  ).length;

  if (totalComplaints) totalComplaints.textContent = total;
  if (submittedCount) submittedCount.textContent = submitted;
  if (progressCount) progressCount.textContent = inProgress;
  if (resolvedCount) resolvedCount.textContent = resolved;
}

// --------------------------------------
// Render complaint cards
// --------------------------------------

function renderComplaints() {
  if (!complaintList) return;

  const searchTerm = (searchInput?.value || "").toLowerCase().trim();
  const selectedCategory = categoryFilter?.value || "All";

  const filtered = complaints.filter(item => {
    const searchableText = [
      item.description || "",
      item.location || "",
      item.category || "Other",
      item.id || ""
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "All" ||
      (item.category || "Other") === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  complaintList.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = complaints.length
      ? "No matching complaints found."
      : "No complaints yet. Report your first civic issue.";

    complaintList.appendChild(empty);
    updateDashboard();
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "complaint-card";

    const heading = document.createElement("h3");
    heading.textContent = item.category || "Other";

    const id = document.createElement("p");
    id.textContent = "Complaint ID: " + (item.id || "N/A");

    const location = document.createElement("p");
    location.textContent = "Location: " + (item.location || "N/A");

    const description = document.createElement("p");
    description.textContent = item.description || "N/A";

    const priority = document.createElement("p");
    priority.textContent =
      "Suggested priority: " + (item.priority || "Low");

    const statusLabel = document.createElement("label");
    statusLabel.appendChild(document.createTextNode("Status: "));

    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", "Update complaint status");

    VALID_STATUSES.forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });

    statusSelect.value = VALID_STATUSES.includes(item.status)
      ? item.status
      : "Submitted";

    applyStatusStyle(statusSelect);

    statusSelect.addEventListener("change", () => {
      const previousStatus = item.status;
      item.status = statusSelect.value;

      if (!saveComplaints()) {
        item.status = previousStatus;
        statusSelect.value = VALID_STATUSES.includes(previousStatus)
          ? previousStatus
          : "Submitted";
        applyStatusStyle(statusSelect);
        return;
      }

      applyStatusStyle(statusSelect);
      updateDashboard();
      showMessage("Complaint status updated successfully.");
    });

    statusLabel.appendChild(statusSelect);

    card.append(
      heading,
      id,
      location,
      description,
      priority,
      statusLabel
    );

    complaintList.appendChild(card);
  });

  updateDashboard();
}

// --------------------------------------
// Submit new complaint
// --------------------------------------

if (form && descriptionInput && locationInput) {
  form.addEventListener("submit", event => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const location = locationInput.value.trim();

    if (!description) {
      showMessage("Please describe the problem first.", true);
      descriptionInput.focus();
      return;
    }

    if (!location) {
      showMessage("Please enter the problem location.", true);
      locationInput.focus();
      return;
    }

    const duplicate = complaints.some(item =>
      (item.description || "").trim().toLowerCase() === description.toLowerCase() &&
      (item.location || "").trim().toLowerCase() === location.toLowerCase()
    );

    if (duplicate) {
      showMessage("This complaint already exists at this location.", true);
      return;
    }

    const analysis = analyzeComplaint(description);

    const newComplaint = {
      id: "CF-" + Date.now().toString(36).toUpperCase(),
      description,
      location,
      category: analysis.category,
      priority: analysis.priority,
      status: "Submitted",
      createdAt: new Date().toISOString()
    };

    complaints.unshift(newComplaint);

    if (!saveComplaints()) {
      complaints.shift();
      return;
    }

    form.reset();

    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "All";

    renderComplaints();

    showMessage("Complaint submitted! ID: " + newComplaint.id);
  });
}

// --------------------------------------
// Search and category filter
// --------------------------------------

if (searchInput) {
  searchInput.addEventListener("input", renderComplaints);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", renderComplaints);
}

// --------------------------------------
// Complaint ID tracking
// --------------------------------------

const trackingForm = document.getElementById("trackingForm");
const trackingIdInput = document.getElementById("trackingId");
const trackingResult = document.getElementById("trackingResult");

if (trackingForm && trackingIdInput && trackingResult) {
  trackingForm.addEventListener("submit", event => {
    event.preventDefault();

    const enteredId = trackingIdInput.value.trim().toLowerCase();
    const allComplaints = loadComplaints();

    const found = allComplaints.find(item =>
      item.id &&
      item.id.toLowerCase() === enteredId
    );

    trackingResult.replaceChildren();

    if (!found) {
      trackingResult.textContent =
        "Complaint ID not found. Please check your ID and try again.";
      trackingResult.style.color = "#c62828";
      return;
    }

    const status = VALID_STATUSES.includes(found.status)
      ? found.status
      : "Submitted";

    const statusColors = {
      "Submitted": "#1d4ed8",
      "In Progress": "#c2410c",
      "Resolved": "#15803d"
    };

    const title = document.createElement("h3");
    title.textContent = "Complaint Found";
    trackingResult.appendChild(title);

    const details = [
      ["Complaint ID", found.id],
      ["Status", status],
      ["Category", found.category || "Other"],
      ["Location", found.location || "Not available"],
      ["Description", found.description || "Not available"],
      [
        "Date Submitted",
        found.createdAt
          ? new Date(found.createdAt).toLocaleString()
          : "Not available"
      ]
    ];

    details.forEach(([label, value]) => {
      const row = document.createElement("p");
      const strong = document.createElement("strong");

      strong.textContent = label + ": ";
      row.appendChild(strong);

      const text = document.createElement("span");
      text.textContent = String(value);

      if (label === "Status") {
        text.style.color = statusColors[status];
        text.style.fontWeight = "700";
      }

      row.appendChild(text);
      trackingResult.appendChild(row);
    });
  });
}

// --------------------------------------
// Initial page load
// --------------------------------------

renderComplaints();
