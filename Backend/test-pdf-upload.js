import fs from 'fs';
import buffer from 'buffer';

async function testUpload() {
  // Create a minimal valid PDF manually
  const pdfContent = "%PDF-1.4\n1 0 obj <</Type/Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages /Count 1 /Kids [3 0 R]>> endobj\n3 0 obj <</Type/Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> /Contents 4 0 R>> endobj\n4 0 obj <</Length 21>> stream\nBT /F1 24 Tf 100 700 Td (Test PDF Content) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000219 00000 n \ntrailer <</Size 5 /Root 1 0 R>>\nstartxref\n289\n%%EOF";
  
  const formData = new FormData();
  formData.append("resume", new Blob([pdfContent], { type: "application/pdf" }), "test.pdf");

  try {
    const response = await fetch("http://65.20.88.66:4000/api/analyze-resume", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    console.log("Status:", response.status);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}

testUpload();
