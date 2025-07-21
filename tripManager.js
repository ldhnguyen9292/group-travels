// tripManager.js
function toggleTripForm() {
  document.getElementById("tripForm").classList.toggle("hidden");
}

function loadTrips() {
  const tripList = document.getElementById("tripList");
  tripList.innerHTML = "";

  const trips = JSON.parse(localStorage.getItem("groupTrips")) || [];
  if (trips.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.id = "noTripMsg";
    emptyMsg.className = "text-gray-500 italic";
    emptyMsg.textContent = translations[currentLang]["noTripMsg"];
    tripList.appendChild(emptyMsg);
    return;
  }

  trips.forEach((trip, index) => {
    const li = document.createElement("li");
    li.className =
      "border border-gray-300 rounded-md p-4 shadow-sm flex justify-between items-center";

    const tripInfo = document.createElement("div");
    tripInfo.innerHTML = `
        <h3 class="text-xl font-semibold">${trip.name}</h3>
        <p>${trip.startDate} - ${trip.endDate}</p>
        <p>${translations[currentLang].participants} ${
      trip.participants.split(",").length
    }</p>
      `;
    li.appendChild(tripInfo);

    const btnGroup = document.createElement("div");
    btnGroup.className = "flex gap-2 items-center";

    const viewBtn = document.createElement("button");
    viewBtn.setAttribute("id", "details");
    viewBtn.textContent = translations[currentLang].details;
    viewBtn.className = "text-blue-600 hover:underline text-sm";
    viewBtn.onclick = () => {
      location.href = `trip.html?id=${trip.id}`;
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.setAttribute("id", "delete");
    deleteBtn.textContent = translations[currentLang].delete;
    deleteBtn.className = "text-red-500 hover:underline text-sm";
    deleteBtn.onclick = () => deleteTrip(trip.id);

    btnGroup.appendChild(viewBtn);
    btnGroup.appendChild(deleteBtn);
    li.appendChild(btnGroup);

    tripList.appendChild(li);
  });
}

function addTrip() {
  const id = Date.now().toString();
  const name = document.getElementById("tripName").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const participants = currentParticipants.join(",");

  if (!name || !startDate || !endDate || !participants) {
    alert(translations[currentLang].fillAllFields);
    return;
  }

  const newTrip = { id, name, startDate, endDate, participants };
  const trips = JSON.parse(localStorage.getItem("groupTrips")) || [];
  trips.push(newTrip);
  localStorage.setItem("groupTrips", JSON.stringify(trips));

  document.getElementById("tripForm").reset();
  loadTrips();
}

function deleteTrip(id) {
  const confirmDelete = confirm(translations[currentLang].confirmDelete);
  if (!confirmDelete) return;

  const trips = JSON.parse(localStorage.getItem("groupTrips")) || [];
  const index = trips.findIndex((t) => {
    return t.id === id;
  });

  if (index < 0) {
    return;
  }

  trips.splice(index, 1);
  localStorage.setItem("groupTrips", JSON.stringify(trips));

  // deleteExpense
  const expenseId = `expenses${id}`;
  localStorage.removeItem(expenseId);

  loadTrips();
}

// participant
let currentParticipants = [];

function addParticipant() {
  const input = document.getElementById("participantInput");
  const name = input.value.trim();
  if (!name) return;

  currentParticipants.push(name);
  renderParticipantList();
  input.value = "";
}

document
  .getElementById("participantInput")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addParticipant();
    }
  });

function renderParticipantList() {
  const list = document.getElementById("participantList");
  list.innerHTML = "";
  currentParticipants.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    list.appendChild(li);
  });
}
