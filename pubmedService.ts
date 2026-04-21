import axios from "axios";

/**
 * PubMed E-utilities API Integration Service
 * Fetches clinical trial data from PubMed using NCBI E-utilities
 */

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const PUBMED_API_KEY = process.env.PUBMED_API_KEY || ""; // Optional: improves rate limits

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  pmc?: string; // PubMed Central ID
  fullTextUrl?: string;
}

/**
 * Search PubMed for clinical trials published after 2025
 */
export async function searchClinicalTrials(params: {
  keyword?: string;
  journal?: string;
  startDate?: string; // Format: YYYY/MM/DD
  maxResults?: number;
}): Promise<{ pmids: string[]; count: number }> {
  const {
    keyword = "",
    journal = "",
    startDate = "2025/01/01",
    maxResults = 100
  } = params;

  // Build PubMed search query
  // Filter: Clinical Trial publication type + date range
  let query = "(Clinical Trial[ptyp] OR Clinical Trial, Phase I[ptyp] OR Clinical Trial, Phase II[ptyp] OR Clinical Trial, Phase III[ptyp] OR Clinical Trial, Phase IV[ptyp])";
  
  // Add date filter (2025 onwards)
  query += ` AND ("${startDate}"[PDAT] : "3000"[PDAT])`;
  
  // Add keyword filter
  if (keyword) {
    query += ` AND (${keyword})`;
  }
  
  // Add journal filter
  if (journal) {
    query += ` AND ${journal}[journal]`;
  }

  try {
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi`;
    const response = await axios.get(searchUrl, {
      params: {
        db: "pubmed",
        term: query,
        retmax: maxResults,
        retmode: "json",
        sort: "pub_date", // Sort by publication date (newest first)
        ...(PUBMED_API_KEY && { api_key: PUBMED_API_KEY })
      },
      timeout: 30000
    });

    const data = response.data;
    const pmids = data.esearchresult?.idlist || [];
    const count = parseInt(data.esearchresult?.count || "0");

    return { pmids, count };
  } catch (error) {
    console.error("[PubMed] Search failed:", error);
    throw new Error("Failed to search PubMed");
  }
}

/**
 * Fetch detailed article information for given PMIDs
 */
export async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  try {
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi`;
    const response = await axios.get(fetchUrl, {
      params: {
        db: "pubmed",
        id: pmids.join(","),
        retmode: "xml",
        rettype: "abstract",
        ...(PUBMED_API_KEY && { api_key: PUBMED_API_KEY })
      },
      timeout: 60000
    });

    // Parse XML response (simplified - in production use proper XML parser)
    const articles = parseArticlesFromXML(response.data);
    return articles;
  } catch (error) {
    console.error("[PubMed] Fetch failed:", error);
    throw new Error("Failed to fetch article details");
  }
}

/**
 * Parse PubMed XML response to extract article information
 * Note: This is a simplified parser. In production, use a proper XML parser like 'fast-xml-parser'
 */
function parseArticlesFromXML(xmlData: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  
  // Extract PMID
  const pmidRegex = /<PMID[^>]*>(\d+)<\/PMID>/g;
  const pmidMatches = xmlData.match(pmidRegex) || [];
  const pmids = pmidMatches.map(m => m.match(/>(\d+)</)?.[1] || "");

  // Extract titles
  const titleRegex = /<ArticleTitle>(.*?)<\/ArticleTitle>/g;
  const titleMatches = xmlData.match(titleRegex) || [];
  const titles = titleMatches.map(m => cleanHtmlTags(m.replace(/<\/?ArticleTitle>/g, "")));

  // Extract abstracts
  const abstractRegex = /<AbstractText[^>]*>(.*?)<\/AbstractText>/g;
  const abstractMatches = xmlData.match(abstractRegex) || [];
  const abstracts = abstractMatches.map(m => cleanHtmlTags(m.replace(/<\/?AbstractText[^>]*>/g, "")));

  // Extract journals
  const journalRegex = /<Title>(.*?)<\/Title>/g;
  const journalMatches = xmlData.match(journalRegex) || [];
  const journals = journalMatches.map(m => cleanHtmlTags(m.replace(/<\/?Title>/g, "")));

  // Extract publication dates
  const dateRegex = /<PubDate>.*?<Year>(\d{4})<\/Year>.*?<\/PubDate>/g;
  const dateMatches = xmlData.match(dateRegex) || [];
  const dates = dateMatches.map(m => {
    const yearMatch = m.match(/<Year>(\d{4})<\/Year>/);
    const year = yearMatch ? yearMatch[1] : "2025";
    return `${year}-01-01`;
  });

  // Extract DOIs
  const doiRegex = /<ArticleId IdType="doi">(.*?)<\/ArticleId>/g;
  const doiMatches = xmlData.match(doiRegex) || [];
  const dois = doiMatches.map(m => m.replace(/<ArticleId IdType="doi">|<\/ArticleId>/g, ""));

  // Extract PMC IDs
  const pmcRegex = /<ArticleId IdType="pmc">(PMC\d+)<\/ArticleId>/g;
  const pmcMatches = xmlData.match(pmcRegex) || [];
  const pmcs = pmcMatches.map(m => m.replace(/<ArticleId IdType="pmc">|<\/ArticleId>/g, ""));

  // Combine extracted data
  const maxLength = Math.max(pmids.length, titles.length, abstracts.length);
  for (let i = 0; i < maxLength; i++) {
    const pmid = pmids[i] || "";
    const doi = dois[i];
    const pmc = pmcs[i];

    articles.push({
      pmid,
      title: titles[i] || "No title available",
      abstract: abstracts[i] || "No abstract available",
      authors: [], // Simplified - would need more complex parsing
      journal: journals[i] || "Unknown journal",
      publicationDate: dates[i] || "Unknown date",
      doi,
      pmc,
      fullTextUrl: doi ? `https://doi.org/${doi}` : pmc ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmc}/` : undefined
    });
  }

  return articles;
}

/**
 * Clean HTML tags from text
 */
function cleanHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Get PDF download link for an article
 */
export function getPDFDownloadLink(article: PubMedArticle): string | null {
  // Try PMC first (free full text)
  if (article.pmc) {
    return `https://pmc.ncbi.nlm.nih.gov/articles/${article.pmc}/pdf/`;
  }
  
  // Try DOI link (may require subscription)
  if (article.doi) {
    return `https://doi.org/${article.doi}`;
  }
  
  return null;
}

/**
 * Get journal submission URL
 */
export function getJournalSubmissionUrl(journalName: string): string | null {
  // Map common journals to their submission portals
  const submissionUrls: Record<string, string> = {
    "The New England Journal of Medicine": "https://www.nejm.org/author-center/submit-a-manuscript",
    "NEJM": "https://www.nejm.org/author-center/submit-a-manuscript",
    "The Lancet": "https://www.thelancet.com/authors",
    "Lancet": "https://www.thelancet.com/authors",
    "JAMA": "https://jamanetwork.com/journals/jama/pages/instructions-for-authors",
    "BMJ": "https://authors.bmj.com/",
    "Nature Medicine": "https://www.nature.com/nm/for-authors",
    "Annals of Internal Medicine": "https://www.acpjournals.org/journal/aim/authors",
  };

  // Try exact match first
  if (submissionUrls[journalName]) {
    return submissionUrls[journalName];
  }

  // Try partial match
  for (const [key, url] of Object.entries(submissionUrls)) {
    if (journalName.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  return null;
}
