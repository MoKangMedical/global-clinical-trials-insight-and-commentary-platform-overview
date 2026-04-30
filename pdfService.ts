import axios from "axios";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * PDF Service
 * Handles PDF download, upload to S3, and text extraction
 */

/**
 * Download PDF from URL
 */
async function downloadPDF(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClinicalTrialsBot/1.0)"
      }
    });

    if (response.status === 200 && response.data) {
      return Buffer.from(response.data);
    }

    return null;
  } catch (error) {
    console.error(`[PDF Service] Failed to download PDF from ${url}:`, error);
    return null;
  }
}

/**
 * Upload PDF to S3 storage
 */
async function uploadPDFToStorage(pdfBuffer: Buffer, pmid: string): Promise<string | null> {
  try {
    const fileKey = `trial-pdfs/${pmid}-${nanoid(8)}.pdf`;
    const result = await storagePut(fileKey, pdfBuffer, "application/pdf");
    
    return result.url;
  } catch (error) {
    console.error(`[PDF Service] Failed to upload PDF to storage:`, error);
    return null;
  }
}

/**
 * Extract text from PDF using pdf-parse
 * Note: This requires pdf-parse package to be installed
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string | null> {
  try {
    // Try to use pdf-parse if available
    try {
      const pdfParseModule = await import("pdf-parse") as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (importError) {
      console.warn("[PDF Service] pdf-parse not available:", importError);
      return null;
    }
  } catch (error) {
    console.error(`[PDF Service] Failed to extract text from PDF:`, error);
    return null;
  }
}

/**
 * Download PDF, upload to S3, and optionally extract text
 */
export async function processPDF(pdfUrl: string, pmid: string): Promise<{
  storageUrl: string | null;
  fullText: string | null;
}> {
  // Download PDF
  const pdfBuffer = await downloadPDF(pdfUrl);
  if (!pdfBuffer) {
    return { storageUrl: null, fullText: null };
  }

  // Upload to S3
  const storageUrl = await uploadPDFToStorage(pdfBuffer, pmid);

  // Extract text (optional, may fail if pdf-parse not installed)
  const fullText = await extractTextFromPDF(pdfBuffer);

  return {
    storageUrl,
    fullText
  };
}

/**
 * Get PDF download URL from PubMed article
 * Priority: PMC free full text > DOI link
 */
export function getPDFUrl(article: {
  pmcId?: string;
  doi?: string;
  fullTextUrl?: string;
}): string | null {
  // Priority 1: PMC free full text
  if (article.pmcId) {
    return `https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcId}/pdf/`;
  }

  // Priority 2: DOI link (may require subscription)
  if (article.doi) {
    return `https://doi.org/${article.doi}`;
  }

  // Priority 3: Full text URL if available
  if (article.fullTextUrl) {
    return article.fullTextUrl;
  }

  return null;
}
