import axios from "axios";
import { InsertTrial } from "../drizzle/schema";
import { insertTrial, insertMethodologicalFlaw } from "./db";
import { extractTrialInformation, identifyMethodologicalFlaws } from "./nlpService";

/**
 * Fetch recent clinical trials from PubMed
 * This is a simplified implementation - in production, you would use the actual PubMed API
 */
export async function fetchTrialsFromPubMed(params: {
  journals?: string[];
  phases?: string[];
  daysBack?: number;
}): Promise<Array<{
  title: string;
  authors: string;
  journal: string;
  doi?: string;
  pubmedId?: string;
  publicationDate: Date;
  abstractText: string;
  fullTextUrl?: string;
}>> {
  // This is a placeholder implementation
  // In production, you would integrate with:
  // 1. PubMed E-utilities API (https://www.ncbi.nlm.nih.gov/books/NBK25501/)
  // 2. Crossref API for DOI metadata
  // 3. Journal-specific RSS feeds or APIs
  
  console.log("[DataCollection] Fetching trials from PubMed", params);
  
  // For demonstration, return empty array
  // In production implementation:
  // - Build PubMed query with journal filters, date range, and trial phase keywords
  // - Parse XML response from E-utilities
  // - Extract metadata and abstracts
  // - Return structured data
  
  return [];
}

/**
 * Process a raw trial data and store it with NLP analysis
 */
export async function processAndStoreTrial(rawTrial: {
  title: string;
  authors: string;
  journal: string;
  doi?: string;
  pubmedId?: string;
  publicationDate: Date;
  abstractText: string;
  fullTextUrl?: string;
  sourceUrl?: string;
  trialPhase: "I" | "II" | "III";
  trialType?: string;
}): Promise<number> {
  try {
    // Step 1: Extract structured information using NLP
    const extracted = await extractTrialInformation(rawTrial.abstractText, rawTrial.title);
    
    // Step 2: Create trial record
    const trialData: InsertTrial = {
      title: rawTrial.title,
      authors: rawTrial.authors,
      journal: rawTrial.journal,
      doi: rawTrial.doi,
      pubmedId: rawTrial.pubmedId,
      publicationDate: rawTrial.publicationDate,
      trialPhase: rawTrial.trialPhase,
      trialType: rawTrial.trialType,
      indication: extracted.indication,
      sampleSize: extracted.sampleSize,
      randomization: extracted.randomization,
      blinding: extracted.blinding,
      primaryEndpoint: extracted.primaryEndpoint,
      secondaryEndpoint: extracted.secondaryEndpoint,
      keyResults: extracted.keyResults,
      statisticalMetrics: extracted.statisticalMetrics,
      conclusion: extracted.conclusion,
      abstractText: rawTrial.abstractText,
      fullTextUrl: rawTrial.fullTextUrl,
      sourceUrl: rawTrial.sourceUrl
    };
    
    const trialId = await insertTrial(trialData);
    
    // Step 3: Get full trial data for flaw analysis
    const trial = await import("./db").then(m => m.getTrialById(trialId));
    if (!trial) {
      throw new Error("Failed to retrieve inserted trial");
    }
    
    // Step 4: Identify methodological flaws
    const flaws = await identifyMethodologicalFlaws(trial);
    
    // Step 5: Store identified flaws
    for (const flaw of flaws) {
      await insertMethodologicalFlaw({
        trialId,
        flawCategory: flaw.category,
        riskLevel: flaw.riskLevel,
        description: flaw.description,
        evidence: flaw.evidence
      });
    }
    
    console.log(`[DataCollection] Successfully processed trial ${trialId}: ${rawTrial.title}`);
    
    return trialId;
  } catch (error) {
    console.error("[DataCollection] Error processing trial:", error);
    throw error;
  }
}

/**
 * Daily update job to fetch and process new trials
 * This should be called by a scheduled task
 */
export async function dailyTrialUpdate(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  console.log("[DataCollection] Starting daily trial update");
  
  const topJournals = [
    "New England Journal of Medicine",
    "The Lancet",
    "JAMA",
    "BMJ",
    "Annals of Internal Medicine"
  ];
  
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  
  try {
    // Fetch trials from the last 24 hours
    const rawTrials = await fetchTrialsFromPubMed({
      journals: topJournals,
      phases: ["I", "II", "III"],
      daysBack: 1
    });
    
    console.log(`[DataCollection] Found ${rawTrials.length} new trials`);
    
    // Process each trial
    for (const rawTrial of rawTrials) {
      try {
        // Determine trial phase from abstract/title
        const phase = determineTrialPhase(rawTrial.abstractText, rawTrial.title);
        
        await processAndStoreTrial({
          ...rawTrial,
          trialPhase: phase
        });
        
        processed++;
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process "${rawTrial.title}": ${errorMsg}`);
        console.error(`[DataCollection] Failed to process trial:`, error);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to fetch trials: ${errorMsg}`);
    console.error("[DataCollection] Failed to fetch trials:", error);
  }
  
  console.log(`[DataCollection] Daily update complete: ${processed} processed, ${failed} failed`);
  
  return { processed, failed, errors };
}

/**
 * Helper function to determine trial phase from text
 */
function determineTrialPhase(abstractText: string, title: string): "I" | "II" | "III" {
  const text = (abstractText + " " + title).toLowerCase();
  
  if (text.includes("phase iii") || text.includes("phase 3")) {
    return "III";
  } else if (text.includes("phase ii") || text.includes("phase 2")) {
    return "II";
  } else if (text.includes("phase i") || text.includes("phase 1")) {
    return "I";
  }
  
  // Default to phase III if not specified (most published trials are phase III)
  return "III";
}

/**
 * Manual trial import for testing or one-off additions
 */
export async function importTrialManually(trialData: {
  title: string;
  authors: string;
  journal: string;
  doi?: string;
  pubmedId?: string;
  publicationDate: Date;
  trialPhase: "I" | "II" | "III";
  abstractText: string;
  fullTextUrl?: string;
  sourceUrl?: string;
}): Promise<number> {
  return await processAndStoreTrial(trialData);
}
