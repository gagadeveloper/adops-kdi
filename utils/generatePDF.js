import puppeteer from "puppeteer";

export async function generatePDF(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();
    return pdfBuffer;
}
