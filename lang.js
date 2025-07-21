// lang.js
let currentLang = "";

const translations = {
  en: {
    tagline: "Your perfect group travel planner app",
    featureTitle: "Key Features",
    feature1: "🧾 Shared expenses tracker and split payments",
    createNewTrip: "Create New Trip",
    tripNameLabel: "Trip Name",
    startDateLabel: "Planned Start Date",
    endDateLabel: "End Date",
    participantLabel: "Participants",
    namePlaceholder: "Enter name",
    addParticipantBtn: "Add",
    saveTripBtn: "Save Trip",
    yourTripsTitle: "Your Trips",
    noTripMsg: "No trips created yet.",
    whatUsersSay: "What Users Say",
    quote1:
      "“Finally, an app that makes group travel planning easy! No more messy group chats.”",
    author1: "– Tuu, Ho Chi Minh City",
    quote2: "“The cost-sharing feature saved our group so much hassle.”",
    author2: "– Nhan, Ho Chi Minh City",
    participants: "Participants:",
    details: "Details",
    delete: "Delete",
    fillAllFields: "Please fill out all fields.",
    confirmDelete: "Are you sure you want to delete this trip?",
    appTitle: "Group Expenses",
    backLink: "← Back to Home",
    tripTitle: "Trip Name:",
    labelStartDate: "Start Date:",
    labelEndDate: "End Date:",
    labelPeopleCount: "Total Participants:",
    confirmDeleteExpense: "Are you sure you want to delete this expense?",
    saveImage: "📸 Save Image Result",
    reviewTitle: "Summary of Expenses by Person",
    addExpenseBtn: "➕ Add Expense",
    expenseTitle: "Expense List",
    tableTitle: "Expense Name",
    tablePayer: "Paid By",
    tableAmount: "Amount",
    tableSplit: "Split Type",
    tableParticipants: "Participants",
    action: "Action",
  },
  vi: {
    tagline: "Ứng dụng lập kế hoạch du lịch nhóm hoàn hảo của bạn",
    featureTitle: "Tính năng nổi bật",
    feature1: "🧾 Theo dõi chi tiêu nhóm và chia tiền dễ dàng",
    createNewTrip: "Tạo chuyến du lịch mới",
    tripNameLabel: "Tên chuyến đi",
    startDateLabel: "Ngày đi dự kiến",
    endDateLabel: "Ngày kết thúc",
    participantLabel: "Người tham gia",
    namePlaceholder: "Nhập tên",
    addParticipantBtn: "Thêm",
    saveTripBtn: "Lưu chuyến đi",
    yourTripsTitle: "Chuyến đi của bạn",
    noTripMsg: "Chưa có chuyến đi nào được tạo.",
    whatUsersSay: "Người dùng nói gì",
    quote1:
      "“Cuối cùng cũng có ứng dụng giúp lập kế hoạch du lịch nhóm dễ dàng! Không còn nhóm chat lộn xộn nữa.”",
    author1: "– Tửu, Hồ Chí Minh",
    quote2:
      "“Tính năng chia chi phí đã giúp nhóm chúng tôi tiết kiệm rất nhiều công sức.”",
    author2: "– Nhân, Hồ Chí Minh",
    participants: "Số người:",
    details: "Chi tiết",
    delete: "Xóa",
    fillAllFields: "Vui lòng điền đầy đủ thông tin.",
    confirmDelete: "Bạn có chắc muốn xóa chuyến đi này?",
    appTitle: "Chi tiêu nhóm",
    backLink: "← Quay lại trang chủ",
    tripTitle: "Tên chuyến đi:",
    labelStartDate: "Ngày đi:",
    labelEndDate: "Ngày kết thúc:",
    labelPeopleCount: "Tổng số người tham gia:",
    confirmDeleteExpense: "Bạn có chắc muốn xóa chi phí này không?",
    saveImage: "📸 Lưu ảnh kết quả",
    reviewTitle: "Tổng kết chi phí theo người",
    addExpenseBtn: "➕ Thêm chi phí",
    expenseTitle: "Danh sách chi phí",
    tableTitle: "Tên chi phí",
    tablePayer: "Người chi",
    tableAmount: "Số tiền",
    tableSplit: "Kiểu chia",
    tableParticipants: "Người tham gia",
    action: "Hành động",
  },
};

function switchLanguage() {
  const lang = currentLang === "vi" ? "en" : "vi";
  localStorage.setItem("language", lang);
  currentLang = lang;

  loadLanguage();
}

function loadLanguage() {
  currentLang = localStorage.getItem("language") || "vi";

  const toggleBtn = document.getElementById("languageToggle");
  if (toggleBtn) {
    toggleBtn.textContent = currentLang === "vi" ? "VN" : "EN";
  }

  const texts = translations[currentLang];
  if (!texts) return;

  Object.keys(texts).forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = texts[id];
    }
  });
}
