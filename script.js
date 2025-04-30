let map = L.map("map").setView([43.65107, -79.347015], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let marker;
map.on("click", function (e) {
  if (marker) marker.setLatLng(e.latlng);
  else marker = L.marker(e.latlng).addTo(map);

  document.getElementById("lat").value = e.latlng.lat;
  document.getElementById("lng").value = e.latlng.lng;
});

// Check login on page load
document.addEventListener("DOMContentLoaded", () => {
  const storedUser = localStorage.getItem("cypress_user");
  if (storedUser) {
    document.getElementById("loginStatus").innerText = `Logged in as: ${storedUser}`;
  } else {
    document.getElementById("loginStatus").innerText = "Not logged in";
  }
});

// Login logic
function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // Simulated login (extend with real auth if needed)
  localStorage.setItem("cypress_user", username);
  document.getElementById("loginStatus").innerText = `Logged in as: ${username}`;
  alert("✅ Logged in successfully!");
}

// Logout logic
function logoutUser() {
  localStorage.removeItem("cypress_user");
  document.getElementById("loginStatus").innerText = "Not logged in";
  alert("You are now logged out.");
}

document.getElementById("issueType").addEventListener("change", function () {
  document.getElementById("customIssueContainer").style.display =
    this.value === "other" ? "block" : "none";
});

document.getElementById("reportForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const typeDropdown = document.getElementById("issueType");
  const customInput = document.getElementById("customIssue");
  let type = typeDropdown.value === "other" ? customInput.value : typeDropdown.value;

  const desc = document.getElementById("description").value.trim();
  const lat = document.getElementById("lat").value;
  const lng = document.getElementById("lng").value;
  const user = localStorage.getItem("cypress_user") || "Anonymous";
  const notify = document.getElementById("notify").checked;
  const media = document.getElementById("media").files[0];

  if (!lat || !lng) return alert("Please pin a location on the map.");
  if (!desc || desc.length < 10) return alert("Enter a detailed description (min 10 chars).");

  const formData = new FormData();
  formData.append("type", type);
  formData.append("desc", desc);
  formData.append("lat", lat);
  formData.append("lng", lng);
  formData.append("user", user);
  formData.append("notify", notify);
  if (media) formData.append("media", media);

  fetch("http://localhost:3000/report", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (res.status === 409) {
        alert("⚠️ A similar issue was already reported at this location.");
        throw new Error("Duplicate");
      }
      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    })
    .then(data => {
      alert("✅ Report submitted!");
      document.getElementById("reportForm").reset();
      marker?.remove();
      marker = null;
    })
    .catch(err => {
      console.error("Submit failed:", err);
      if (err.message !== "Duplicate") {
        alert("Something went wrong while submitting your report.");
      }
    });
});
