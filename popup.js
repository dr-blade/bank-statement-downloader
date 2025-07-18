const btn = document.getElementById("download");

btn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    alert("Unable to read the current page");
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Downloading...";

  const url = new URL(tab.url);
  if (url.hostname.endsWith("bnpparibas.pl")) {
    const targetYear = 2025;
    const targetMonth = 6;
    chrome.runtime.sendMessage(
        { action: "FETCH_BNP_STATEMENTS_FOR_MONTH",
          targetYear: targetYear,
          targetMonth: targetMonth
        },
        (response) => {
          btn.disabled = false;
          btn.textContent = "Download Statements";

          if (!response.success) {
            console.error("❌ Error:", response.error);
            return;
          }
          console.log("✅ Received files for ZIP:", response.files);
          createZipAndDownload(response.files);
        }
    );
  } else if (url.hostname.endsWith("nestbank.pl")) {
    const contextId = "<YOUR CONTEXT ID>";
    const accountIds = [
      "<YOUR ACCOUNT ID>",
      "<YOUR ACCOUNT ID>"
    ];
    const targetYear = "2025";
    const targetMonth = "06";
    const { dateFrom, dateTo } = getDateRangeForNestBank();
    chrome.runtime.sendMessage(
        { action: "FETCH_NEST_STATEMENTS_FOR_MONTH",
          contextId: contextId,
          accountIds: accountIds,
          dateFrom: dateFrom,
          dateTo: dateTo,
          targetYear: targetYear,
          targetMonth: targetMonth
        },
        (response) => {
          btn.disabled = false;
          btn.textContent = "Download Statements";

          if (!response.success) {
            console.error("❌ Error:", response.error);
            return;
          }
          console.log("✅ Received files for ZIP:", response.files);
          createZipAndDownload(response.files);
        }
    );
  } else {
    alert("Downloading statements works only on BNP Paribas or Nest Bank pages");
  }
});

function getDateRangeForNestBank() {
  const today = new Date();
  const dateTo = today;
  const dateFrom = new Date(today);
  dateFrom.setMonth(dateFrom.getMonth() - 3);

  function formatDate(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  return {
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo)
  };
}

async function createZipAndDownload(files) {
  const zip = new JSZip();

  for (let f of files) {
    if (f.isBinary) {
      zip.file(f.filename, Uint8Array.from(atob(f.content), c => c.charCodeAt(0)));
    } else {
      zip.file(f.filename, decodeURIComponent(escape(atob(f.content))));
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });

  const zipUrl = URL.createObjectURL(blob);
  const zipName = `statements_${new Date().toISOString().slice(0,10)}.zip`;

  chrome.downloads.download({
    url: zipUrl,
    filename: zipName,
    saveAs: true
  });
}



