function showQRModal() {
  document.getElementById("qrModal").style.display = "flex";
}

function hideQRModal() {
  document.getElementById("qrModal").style.display = "none";
}

function chooseQRUpload() {
  const fileInput = document.getElementById("qrUpload");
  hideQRModal(); // Ẩn modal sau khi chọn

  fileInput.onchange = function () {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      exportToPDFWithQR(event.target.result); // Base64 QR image
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  fileInput.click();
}

function exportToPDFWithQR(qrImageBase64) {
  hideQRModal();

  const containerClone = document.getElementById("reviewContainer").cloneNode(true);

  if (qrImageBase64) {
    const qrImg = document.createElement("img");
    qrImg.src = qrImageBase64;
    qrImg.alt = "QR Code";
    qrImg.style.display = "block";
    qrImg.style.marginTop = "20px";
    qrImg.style.maxWidth = "200px";
    containerClone.appendChild(qrImg);
  }

  const opt = {
    margin: 10,
    filename: `trip-${trip.name}-review.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(containerClone).save();
}

function handleExportPDF() {
  const fileInput = document.getElementById("qrUpload");

  // Khi người dùng chọn file, tiến hành export
  fileInput.onchange = function () {
    const file = fileInput.files[0];

    const reader = new FileReader();
    reader.onload = function (event) {
      exportToPDFWithQR(event.target.result); // Truyền base64 image vào hàm export
    };

    if (file) {
      reader.readAsDataURL(file);
    } else {
      // Không chọn ảnh => xuất PDF không có QR
      exportToPDFWithQR(null);
    }
  };

  // Kích hoạt click để mở file picker
  fileInput.click();
}

function captureReview() {
  html2canvas(document.getElementById("reviewContainer")).then((canvas) => {
    const link = document.createElement("a");
    link.download = `trip-${trip.name}-review.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}
