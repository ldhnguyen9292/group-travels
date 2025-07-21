// loadHeaderFooter.js
async function loadSection(id, file) {
  try {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
  } catch (err) {
    console.error(`Error loading ${file}:`, err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSection("headerContainer", "header.html");
  await loadSection("footerContainer", "footer.html");
  loadLanguage();

  const path = window.location.pathname;
  const isIndexPage = path.endsWith("index.html") || path.endsWith("/");
  if (!isIndexPage) {
    document.getElementById(
      "backLinkDiv"
    ).innerHTML = `<a id="backLink" href="index.html" class="text-sm underline hover:text-blue-200 cursor-pointer">
        ← Back to Home
      </a>`;
  } else {
    document.getElementById("backLinkDiv").innerHTML = "";
    loadTrips();
  }
});
