# bank-statement-downloader

**bank-statement-downloader** is a Chrome browser extension that allows you to quickly download bank statements from BNP Paribas (Poland) and Nest Bank (Poland) in MT940 and PDF formats.

---

## Project Description

I created this extension because I was tired of clicking through each statement one by one. Now I can download all statements from all my bank accounts in one click — both in MT940 and PDF formats.

The statements are downloaded as a ZIP archive.

---

## How It Works

- After logging into your BNP Paribas or Nest Bank account in Chrome, the extension lets you download statements with a single click.
- Currently, the date range (e.g., month 06-2025) is hardcoded in the source code and must be manually changed to download statements for a different period.
- For Nest Bank, you also need to manually provide the `contextId` (which you can find in the browser’s developer tools while on the bank’s website) and a list of `accountIds` in the code.

---

## Requirements

- Google Chrome browser
- Account at BNP Paribas (Poland) or Nest Bank (Poland)
- Basic knowledge of editing the source code to set dates and parameters for Nest Bank

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YourUsername/bank-statement-downloader.git
2. Open Chrome and go to chrome://extensions/
3. Enable Developer Mode
4. Load the unpacked extension and select the project folder

## Configuration

- In the source code, update the following:
  - The month and year for which you want to download statements (e.g., `06-2025`)
  - For Nest Bank: set the `contextId` and the list of `accountIds`

---

## Usage

1. Log in to your bank account in Chrome
2. Open the extension
3. Click the button to download statements
4. Download the ZIP file containing statements in MT940 and PDF formats

---

## Limitations

- Dates and parameters are hardcoded in the code
- Supports only two banks (BNP Paribas and Nest Bank)
- Requires manual configuration for Nest Bank

---

## Disclaimer

This extension was created for personal use and convenience. Use it at your own risk.

**Important:**

- I am not responsible for any damage, loss, or issues that may arise from using this extension.
- Banks may consider this tool as scraping and could potentially block or restrict your account.
- Users are free to modify the source code as they wish, but should be aware of the potential risks.
- Always comply with your bank’s terms of service.

---

## Future Plans

- Add dynamic date selection via the extension UI
- Automate detection of `contextId` and `accountIds` for Nest Bank
- Add support for more banks

---

## License

This project is licensed under the MIT License.

---

**Author:** [@dr-blade](https://github.com/Tdr-blade)

---

Feel free to open issues or pull requests with suggestions or improvements!
