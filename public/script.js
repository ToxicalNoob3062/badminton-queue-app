const queueTableBody = document.querySelector("#queueTable tbody");
const joinButton = document.getElementById("joinButton");
const nameInput = document.getElementById("nameInput");
const currentDateElement = document.getElementById("currentDate");
const emptyQueueMessage = document.getElementById("emptyQueueMessage");
const queueTable = document.getElementById("queueTable");

const maxQueueSize = 20;
const localStorageKey = "badmintonQueueName";

// Capitalize the first character of each word in the name input and limit to alphabetical characters
nameInput.addEventListener("input", () => {
  // Replace multiple spaces with a single space and limit to 10 characters
  nameInput.value = nameInput.value
    .replace(/[^a-zA-Z. ]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 10);

  // Split by space, capitalize each word, and join back with a single space
  nameInput.value = nameInput.value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

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
    emptyQueueMessage.classList.remove("hidden");
    queueTable.classList.add("hidden");
  } else {
    emptyQueueMessage.classList.add("hidden");
    queueTable.classList.remove("hidden");

    // Add each entry with time in "HH:MM AM/PM" format and serial numbering
    queue.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${
        entry.time
      }</td>`;
      queueTableBody.appendChild(row);
    });
  }
}

// Add a new name to the queue
function joinQueue(name) {
  if (!name) return;

  fetch("/queue")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load queue");
      }
      return response.json();
    })
    .then((queue) => {
      if (queue.length >= maxQueueSize) {
        alert("Queue is full!");
        return; // Exit the function early
      }

      // Check if the name already exists in the queue
      const nameExists = queue.some((entry) => entry.name === name);
      if (nameExists) {
        alert("Name already exists in the queue!");
        return; // Exit the function early
      }

      const newEntry = { name };
      return fetch("/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
    })
    .then((response) => {
      if (!response || !response.ok) {
        throw new Error("Failed to add to queue");
      }
      return response.json();
    })
    .then((queue) => {
      updateQueueTable(queue);
      localStorage.setItem(localStorageKey, name); // Save name to local storage
    })
    .catch((error) => console.error("Error joining queue:", error))
    .finally(() => {
      nameInput.value = ""; // Clear input
    });
}

// Fetch and display the current date from the server
function loadCurrentDate() {
  fetch("/current-date")
    .then((response) => response.json())
    .then((data) => {
      if (data.currentDate) {
        currentDateElement.textContent = formatDate(data.currentDate);
      } else {
        currentDateElement.textContent = "Today's Date: Not available";
      }
    })
    .catch((error) => console.error("Error fetching current date:", error));
}

// Format date to "10th October, 2024"
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  const daySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${day}${daySuffix(day)} ${month}, ${year}`;
}

// Load name from local storage if available
function loadNameFromLocalStorage() {
  const savedName = localStorage.getItem(localStorageKey);
  if (savedName) {
    nameInput.value = savedName;
  }
}

// Event Listener
joinButton.addEventListener("click", () => {
  joinQueue(nameInput.value);
});

// Load the queue, current date, and name from local storage on page load
document.addEventListener("DOMContentLoaded", () => {
  loadQueue();
  loadCurrentDate();
  loadNameFromLocalStorage();
});
