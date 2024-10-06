const queueTableBody = document.querySelector("#queueTable tbody");
const joinButton = document.getElementById("joinButton");
const nameInput = document.getElementById("nameInput");
const resetButton = document.getElementById("resetButton");
const adminPassword = document.getElementById("adminPassword");

const maxQueueSize = 8;

// Load the queue from the server
function loadQueue() {
  fetch("/queue")
    .then((response) => response.json())
    .then((queue) => updateQueueTable(queue))
    .catch((error) => console.error("Error loading queue:", error));
}

// Update the queue table in the UI
function updateQueueTable(queue) {
  queueTableBody.innerHTML = ""; // Clear existing rows

  if (queue.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.textContent = "The queue is empty.";
    cell.style.textAlign = "center";
    row.appendChild(cell);
    queueTableBody.appendChild(row);
  } else {
    queue.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${entry.name}</td><td>${new Date(
        entry.timestamp
      ).toLocaleString()}</td>`;
      queueTableBody.appendChild(row);
    });
  }
}

// Add a new name to the queue
function joinQueue(name) {
  if (!name) return;

  fetch("/queue")
    .then((response) => response.json())
    .then((queue) => {
      if (queue.length >= maxQueueSize) {
        alert("Queue is full!");
        return;
      }

      const newEntry = { name, timestamp: Date.now() };
      return fetch("/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
    })
    .then((response) => response.json())
    .then((queue) => {
      updateQueueTable(queue);
      nameInput.value = ""; // Clear input
    })
    .catch((error) => console.error("Error joining queue:", error));
}

// Reset the queue
function resetQueue() {
  const password = adminPassword.value;
  fetch("/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        loadQueue(); // Reload the queue
        alert(result.message);
      } else {
        alert(result.error);
      }
      adminPassword.value = ""; // Clear password input
    })
    .catch((error) => console.error("Error resetting queue:", error));
}

// Event Listeners
joinButton.addEventListener("click", () => {
  joinQueue(nameInput.value);
});

resetButton.addEventListener("click", resetQueue);

// Load the queue on page load
loadQueue();
