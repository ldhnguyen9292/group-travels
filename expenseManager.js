// expenseManager.js
const tripId = new URLSearchParams(window.location.search).get("id");
const trip = JSON.parse(localStorage.getItem("groupTrips") || "[]").find((t) => {
  return t.id === tripId;
});

if (!trip) {
  window.location.href = "/";
}

const participants = trip.participants.split(",");
const expenseKey = `expenses${tripId}`;
const expenses = JSON.parse(localStorage.getItem(expenseKey) || "[]");

const expenseTableBody = document.getElementById("expenseTableBody");

// Render
function renderTripInfo() {
  if (!trip) return;
  document.getElementById("tripName").textContent = trip.name;
  document.getElementById("tripStart").textContent = trip.startDate;
  document.getElementById("tripEnd").textContent = trip.endDate;
  document.getElementById("tripPeopleCount").textContent = participants.length;
}

function renderExpenses() {
  const tbody = document.getElementById("expenseTableBody");
  tbody.innerHTML = "";

  if (!expenses.length) return;

  expenses.forEach((expense) => {
    const tr = document.createElement("tr");

    // Tên chi phí
    const tdTitle = document.createElement("td");
    tdTitle.className = "py-2 px-4";
    tdTitle.textContent = expense.name;
    tr.appendChild(tdTitle);

    // Người chi
    const tdPayer = document.createElement("td");
    tdPayer.className = "py-2 px-4";
    tdPayer.textContent = expense.paidBy;
    tr.appendChild(tdPayer);

    // Số tiền
    const tdAmount = document.createElement("td");
    tdAmount.className = "py-2 px-4";
    tdAmount.textContent = Number(expense.amount).toLocaleString() + " ₫";
    tr.appendChild(tdAmount);

    // Kiểu chia
    const tdSplit = document.createElement("td");
    tdSplit.className = "py-2 px-4";
    tdSplit.textContent =
      expense.splitType === "equal"
        ? translations[currentLang].splitEqually
        : translations[currentLang].splitIndividually;
    tr.appendChild(tdSplit);

    // Người tham gia
    const tdParticipants = document.createElement("td");
    tdParticipants.className = "py-2 px-4";

    const scrollableDiv = document.createElement("div");
    scrollableDiv.className = "max-h-24 overflow-y-auto leading-snug";

    // Thêm nội dung nếu perPerson hợp lệ
    if (expense.perPerson && typeof expense.perPerson === "object") {
      const lines = Object.entries(expense.perPerson).map(
        ([name, amount]) => `<div>${name}: ${Number(amount).toLocaleString()} ₫</div>`
      );
      scrollableDiv.innerHTML = lines.join("");
    }

    // Gắn div cuộn vào td và thêm td vào dòng
    tdParticipants.appendChild(scrollableDiv);
    tr.appendChild(tdParticipants);

    // Hành động
    const tdActions = document.createElement("td");
    tdActions.className = "py-2 px-4 h-24 text-center flex justify-center items-center gap-2";

    // Nút Edit
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded";
    editBtn.addEventListener("click", () => handleEditExpense(expense.id));

    // Nút Remove
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.className = "bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded";
    removeBtn.addEventListener("click", () => handleRemoveExpense(expense.id));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(removeBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function renderAddExpenseForm() {
  currentLang = localStorage.getItem("language") || "vi";
  const expenseNameText = currentLang === "en" ? "Expense name" : "Tên chi phí";
  const amountText = currentLang === "en" ? "Amount" : "Số tiền";
  const noteText = currentLang === "en" ? "Note (optional)" : "Ghi chú (tùy chọn)";

  const formContainer = document.getElementById("renderExpenseForm");
  formContainer.className = "bg-white shadow rounded p-4 mb-6 hidden";
  formContainer.innerHTML = `
    <form id="expenseForm">
      <h4 id="addExpenseText" class="text-lg font-semibold mb-2"></h4>
      <div id="expenseId" class="hidden"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input id="expenseName" type="text" placeholder="${expenseNameText}" class="border p-2 rounded" required>
        <select id="expensePaidBy" class="border p-2 rounded" required>
          ${participants.map((p) => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <input id="expenseAmount" type="number" step="0.01" placeholder="${amountText}" class="border p-2 rounded" required>
        <input id="expenseNote" type="text" placeholder="${noteText}" class="border p-2 rounded">
      </div>
      <div class="mt-4">
        <label class="mr-4"><input type="radio" name="splitType" value="equal" checked> <span id="splitEqually"></span></label>
        <label><input type="radio" name="splitType" value="custom"> <span id="splitIndividually"></span></label>
      </div>
      <div class="mt-4" id="participantCheckboxes">
        <p id="selectParticipants" class="mb-2"></p>
        <div class="flex gap-2 mb-2">
          <button id="selectAllBtn" type="button" onclick="selectAllParticipants()" class="px-2 py-1 bg-blue-500 text-white rounded text-sm">
            ${translations[currentLang].selectAllBtn}
          </button>
          <button id="deselectAllBtn" type="button" onclick="deselectAllParticipants()" class="px-2 py-1 bg-gray-400 text-white rounded text-sm">
            ${translations[currentLang].deselectAllBtn}
          </button>
        </div>
        ${participants
          .map(
            (p) => `
          <label class="mr-4">
            <input type="checkbox" name="expenseParticipants[]" value="${p}" onchange="updateSplitFields()"> ${p}
          </label>`
          )
          .join("")}
      </div>
      <div class="mt-4" id="individualSplitFields"></div>
      <button id="formSave" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded hidden">
        ${translations[currentLang].formSave}
      </button>
      <button id="formEdit" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded hidden">
        ${translations[currentLang].formEdit}
      </button>
      <button id="formReset" type="reset" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
        ${translations[currentLang].formReset}
      </button>
      <button id="formCancel" type="button" onclick="cancelExpenseForm()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
        ${translations[currentLang].formCancel}
      </button>
    </form>
    `;
  document.querySelector("main").appendChild(formContainer);
  document.getElementById("formSave").addEventListener("click", (e) => {
    handleChangeExpense(e, "submit");
  });
  document.getElementById("formEdit").addEventListener("click", (e) => {
    handleChangeExpense(e, "edit");
  });
}

function renderExpenseReview() {
  const reviewContainer = document.getElementById("reviewContainer");
  reviewContainer.innerHTML = "";

  const balanceMap = {}; // { name: { total, paid, shouldPay, details: [] } }

  expenses.forEach((expense) => {
    const amount = parseFloat(expense.amount);
    const perPerson = expense.perPerson || {};

    // Người chi tiền
    if (!balanceMap[expense.paidBy]) {
      balanceMap[expense.paidBy] = {
        total: 0,
        paid: 0,
        shouldPay: 0,
        details: [],
      };
    }
    balanceMap[expense.paidBy].total += amount;
    balanceMap[expense.paidBy].paid += amount;

    // Những người tham gia
    for (const [person, value] of Object.entries(perPerson)) {
      const num = parseFloat(value);
      if (!balanceMap[person]) {
        balanceMap[person] = {
          total: 0,
          paid: 0,
          shouldPay: 0,
          details: [],
        };
      }
      balanceMap[person].total -= num;
      balanceMap[person].shouldPay += num;
      balanceMap[person].details.push({
        expenseName: expense.name,
        amount: num,
      });
    }
  });

  let totalExpense = 0;
  let totalCollected = 0;

  for (const [name, data] of Object.entries(balanceMap)) {
    const div = document.createElement("div");

    const bgColor =
      data.total > 0
        ? "bg-green-100 text-green-800"
        : data.total < 0
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";

    div.className = `p-3 rounded shadow ${bgColor}`;

    const detailList = data.details
      .map((d) => `<li class="ml-4 list-disc">${d.expenseName}: <strong>${d.amount.toFixed(2)} đ</strong></li>`)
      .join("");

    div.innerHTML = `
      <p class="font-semibold mb-1">${name}:</p>
      <ul class="mb-2">${detailList}</ul>
      <p class="ml-2 text-sm">🧾 <strong>${
        translations[currentLang].totalOwedLabel
      }:</strong> ${data.shouldPay.toLocaleString()} đ</p>
      <p class="ml-2 text-sm">💰 <strong>${
        translations[currentLang].totalPaidLabel
      }:</strong> ${data.paid.toLocaleString()} đ</p>
      <p class="ml-2 text-sm">
        <strong>${translations[currentLang].balanceResultLabel}:</strong> 
        <span class="font-bold">
          ${data.total.toFixed(2)} đ
        </span>
        ${
          data.total > 0
            ? `${translations[currentLang].receivedBack}`
            : data.total < 0
            ? `${translations[currentLang].needToPay}`
            : `${translations[currentLang].balanced}`
        }
      </p>
    `;

    totalExpense += data.paid;
    totalCollected += data.shouldPay;

    reviewContainer.appendChild(div);
  }

  const diff = totalExpense - totalCollected;
  const summaryHTML = `
    <p><span id="totalExpenseText">${
      translations[currentLang].totalExpenseText
    }</span> <strong>${totalExpense.toLocaleString()}</strong></p>
    <p><span id="totalPaidText">${
      translations[currentLang].totalPaidText
    }</span> <strong>${totalCollected.toLocaleString()}</strong></p>
    <p class="${diff === 0 ? "text-green-600" : "text-red-600"} font-semibold mt-2">
      ${
        diff === 0
          ? `<span id="balanceMatched">${translations[currentLang].balanceMatched}</span>`
          : `⚠️ <span id="diffText">${translations[currentLang].diffText}</span>: ${diff.toLocaleString()}`
      }
    </p>
  `;

  document.getElementById("summaryCheck").innerHTML = summaryHTML;
}

// Utils
function saveExpense(expense, type = "submit") {
  if (type === "submit") {
    expenses.push(expense);
  } else {
    const index = expenses.findIndex((e) => {
      return e.id === expense.id;
    });

    if (index < 0) {
      return;
    }

    expenses[index] = expense;
  }
  localStorage.setItem(expenseKey, JSON.stringify(expenses));
}

function handleEditExpense(id) {
  document.getElementById("renderExpenseForm").className = "bg-white shadow rounded p-4 mb-6";
  document.getElementById("formSave").className =
    "mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded hidden";
  document.getElementById("formEdit").className = "mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded";

  const expense = expenses.find((e) => {
    return e.id === id;
  });

  // Gán thông tin cơ bản
  document.getElementById("expenseId").value = expense.id;
  document.getElementById("expenseName").value = expense.name;
  document.getElementById("expensePaidBy").value = expense.paidBy;
  document.getElementById("expenseAmount").value = parseFloat(expense.amount);
  document.getElementById("expenseNote").value = expense.note;

  // Gán kiểu chia
  document.querySelectorAll('input[name="splitType"]').forEach((radio) => {
    radio.checked = radio.value === (expense.splitType || "equal");
  });

  // Reset tất cả checkbox và trường nhập chia riêng
  const participantCheckboxes = document.querySelectorAll(`input[name='expenseParticipants[]']`);
  const individualSplitFields = document.querySelectorAll(`individualAmount-`);

  participantCheckboxes.forEach((checkbox) => {
    const name = checkbox.value;
    const isIncluded = expense.perPerson && name in expense.perPerson;
    checkbox.checked = isIncluded;
  });

  individualSplitFields.forEach((input) => {
    const name = input.getAttribute("data-name");
    if (expense.splitType === "custom" && expense.perPerson && name in expense.perPerson) {
      input.value = expense.perPerson[name];
      input.disabled = false;
    } else {
      input.value = "";
      input.disabled = expense.splitType !== "custom";
    }
  });
}

function handleRemoveExpense(id) {
  if (confirm(translations[currentLang].confirmDeleteExpense)) {
    const index = expenses.findIndex((e) => {
      return e.id === id;
    });
    expenses.splice(index, 1); // Xóa expense
    localStorage.setItem(expenseKey, JSON.stringify(expenses));
    renderExpenses(); // Cập nhật lại bảng
    renderExpenseReview();
  }
}

function handleChangeExpense(event, type = "submit") {
  event.preventDefault();
  const id = document.getElementById("expenseId").value;
  const name = document.getElementById("expenseName").value;
  const paidBy = document.getElementById("expensePaidBy").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const note = document.getElementById("expenseNote").value || "";
  const splitType = document.querySelector("input[name='splitType']:checked").value;
  const participants = Array.from(document.querySelectorAll("input[name='expenseParticipants[]']:checked")).map(
    (i) => i.value
  );

  let perPerson = {};
  if (splitType === "equal") {
    const share = parseFloat((amount / participants.length).toFixed(2));
    participants.forEach((p) => {
      perPerson[p] = share;
    });
  } else {
    participants.forEach((p) => {
      const individual = parseFloat(document.getElementById(`individualAmount-${p}`).value);
      if (!isNaN(individual)) {
        perPerson[p] = individual;
      }
    });
  }

  const expense = {
    id: id || Date.now().toString(),
    tripId: tripId,
    name,
    paidBy,
    amount,
    note,
    perPerson,
    splitType,
  };

  saveExpense(expense, type);
  renderExpenses();
  renderExpenseReview();
  document.getElementById("expenseForm").reset();
  document.getElementById("renderExpenseForm").className = "bg-white shadow rounded p-4 mb-6 hidden";
}

function selectAllParticipants() {
  const checkboxes = document.querySelectorAll('input[name="expenseParticipants[]"]');
  checkboxes.forEach((cb) => (cb.checked = true));
  updateSplitFields();
}

function deselectAllParticipants() {
  const checkboxes = document.querySelectorAll('input[name="expenseParticipants[]"]');
  checkboxes.forEach((cb) => (cb.checked = false));
  updateSplitFields();
}

function cancelExpenseForm() {
  document.getElementById("expenseForm").reset();
  document.getElementById("individualSplitFields").innerHTML = "";
  document.querySelectorAll('input[name="expenseParticipants[]"]').forEach((cb) => (cb.checked = false));
  document.getElementById("renderExpenseForm").className = "bg-white shadow rounded p-4 mb-6 hidden";
}

window.updateSplitFields = function () {
  const type = document.querySelector("input[name='splitType']:checked").value;
  const selected = Array.from(document.querySelectorAll("input[name='expenseParticipants[]']:checked")).map(
    (i) => i.value
  );
  const fields = document.getElementById("individualSplitFields");
  fields.innerHTML = "";
  if (type === "custom") {
    selected.forEach((p) => {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.01";
      input.id = `individualAmount-${p}`;
      input.placeholder = `Số tiền cho ${p}`;
      input.className = "block mt-2 border p-2 rounded w-full md:w-1/2";
      fields.appendChild(input);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  renderTripInfo();
  renderAddExpenseForm();
  renderExpenses();
  renderExpenseReview();
});

document.getElementById("addExpenseBtn").addEventListener("click", () => {
  document.getElementById("renderExpenseForm").className = "bg-white shadow rounded p-4 mb-6";
  document.getElementById("formSave").className = "mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded";
  document.getElementById("formEdit").className =
    "mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded hidden";
});
