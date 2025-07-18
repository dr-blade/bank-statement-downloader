let nestTokens = {
  sessionToken: null,
  untrustedDevice: null,
};

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      for (const header of details.requestHeaders) {
        if (header.name.toLowerCase() === 'session-token') {
          nestTokens.sessionToken = header.value;
        }
        if (header.name.toLowerCase() === 'untrusted-device') {
          nestTokens.untrustedDevice = header.value;
        }
      }
    },
    { urls: ["*://login.nestbank.pl/*"] },
    ["requestHeaders"]
);

function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "FETCH_BNP_STATEMENTS_FOR_MONTH") {
        const { targetYear, targetMonth } = message;
        const baseYear = 2025;
        const baseMonth = 6;
        const baseSeq = 50;

        // Calculate the difference in months between the base month and the requested month
        const diffMonths = (targetYear - baseYear) * 12 + (targetMonth - baseMonth);
        const seq = baseSeq + diffMonths;
        // Create the bank statement number, e.g. 00050-2025
        const number = String(seq).padStart(5, "0") + `-${targetYear}`;

        (async () => {
            let resultFiles = [];

            try {
                const accountsResp = await fetch("https://goonline.bnpparibas.pl/gateway/api/bnp-nib-products-service/v4/accounts", {
                    credentials: "include"
                });
                if (!accountsResp.ok) throw new Error(`HTTP ${accountsResp.status} while fetching BNP accounts`);
                const accountsJson = await accountsResp.json();
                const accountList = accountsJson.currentAccounts.products.map(acc => acc.id);
                for (const accId of accountList) {
                    try {
                        const stmtUrl = `https://goonline.bnpparibas.pl/gateway/api/bnp-nib-products-service/v3/accounts/${accId}/statements/${number}-1-WZ-${accId}/mt940?mt940Format=BNP`;
                        const stmtResp = await fetch(stmtUrl, { credentials: "include" });
                        if (!stmtResp.ok) {
                            console.warn(`⚠️ No statement found for account ${accId}, HTTP ${stmtResp.status}`);
                            continue;
                        }

                        const textContent = await stmtResp.text();
                        const textBase64 = btoa(unescape(encodeURIComponent(textContent)));
                        resultFiles.push({
                            filename: `BNP_${accId}_${number}.mt940`,
                            content: textBase64,
                            isBinary: false
                        });

                        const pdfUrl = stmtUrl.replace("/mt940?mt940Format=BNP", "");
                        const pdfResp = await fetch(pdfUrl, { credentials: "include" });
                        const pdfBuffer = await pdfResp.arrayBuffer();
                        const pdfBase64 = arrayBufferToBase64(pdfBuffer);
                        resultFiles.push({
                            filename: `BNP_${accId}_${number}.pdf`,
                            content: pdfBase64,
                            isBinary: true
                        });
                    } catch (errAcc) {
                        console.error(`❌ Error for BNP account ${accId}:`, errAcc.message);
                    }
                }

            } catch (err) {
                console.error("❌ Main BNP error:", err.message);

            }
            sendResponse({ success: true, files: resultFiles });
        })();
        return true; // async
    }

    if (message.action === "FETCH_NEST_STATEMENTS_FOR_MONTH") {
        const { contextId, accountIds, dateFrom, dateTo, targetYear, targetMonth } = message;
        (async () => {
            let resultFiles = [];
            for (const accId of accountIds) {
                try {
                    const listUrl = `https://login.nestbank.pl/rest/v1/context/${contextId}/account/${accId}/statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
                    const listResp = await fetch(listUrl, {
                        credentials: "include",
                        headers: {
                            'Context-Id': `${message.contextId}`,
                            'Session-Token': nestTokens.sessionToken || '',
                            'Untrusted-device': nestTokens.untrustedDevice || '',
                        }});
                    if (!listResp.ok) throw new Error(`HTTP ${listResp.status} fetching list for account ${accId}`);
                    const statements = await listResp.json();
                    const found = statements.find(item => {
                        const start = new Date(item.startDate);
                        return (
                            start.getFullYear() === parseInt(targetYear) &&
                            (start.getMonth() + 1) === parseInt(targetMonth)
                        );
                    });
                    if (!found) {
                        console.warn(`⚠️ No statement for ${targetMonth}/${targetYear} for account ${accId}`);
                        continue;
                    }
                    {
                        const stmtUrl = `https://login.nestbank.pl/rest/v1/context/${contextId}/account/${accId}/statement/${found.statementId}?format=mt940`;
                        const stmtResp = await fetch(stmtUrl, {
                            credentials: "include",
                            headers: {
                                'Session-Token': nestTokens.sessionToken || '',
                                'Untrusted-device': nestTokens.untrustedDevice || '',
                            }});
                        if (!stmtResp.ok) throw new Error(`HTTP ${stmtResp.status} fetching statement for account ${accId}`);
                        const textContent = await stmtResp.text();
                        const textBase64 = btoa(unescape(encodeURIComponent(textContent)));
                        resultFiles.push({
                            filename: `NEST_${accId}_${targetYear}_${String(targetMonth).padStart(2, "0")}.mt940`,
                            content: textBase64,
                            isBinary: false
                        });
                    }
                    {
                        const stmtUrl = `https://login.nestbank.pl/rest/v1/context/${contextId}/account/${accId}/statement/${found.statementId}?format=pdf`;
                        const stmtResp = await fetch(stmtUrl, {
                            credentials: "include",
                            headers: {
                                'Session-Token': nestTokens.sessionToken || '',
                                'Untrusted-device': nestTokens.untrustedDevice || '',
                            }
                        });
                        if (!stmtResp.ok) throw new Error(`HTTP ${stmtResp.status} fetching statement for account ${accId}`);
                        const pdfBuffer = await stmtResp.arrayBuffer();
                        const pdfBase64 = arrayBufferToBase64(pdfBuffer);
                        resultFiles.push({
                            filename: `NEST_${accId}_${targetYear}_${String(targetMonth).padStart(2, "0")}.pdf`,
                            content: pdfBase64,
                            isBinary: true
                        });
                    }
                } catch (err) {
                    console.error(`❌ Error for account ${accId}:`, err.message);
                }
            }
            sendResponse({ success: true, files: resultFiles });
        })();
        return true; // async
    }
});





