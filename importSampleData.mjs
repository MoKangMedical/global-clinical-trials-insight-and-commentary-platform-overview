/**
 * Sample data import script for Clinical Trials Platform
 * This script imports sample clinical trial data for testing and demonstration
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Load environment variables
config();

const sampleTrials = [
  {
    title: "Efficacy and Safety of Novel Anticoagulant in Atrial Fibrillation: A Randomized Controlled Trial",
    authors: "Smith J, Johnson M, Williams R, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2024001",
    pubmedId: "35000001",
    publicationDate: new Date("2024-01-15"),
    trialPhase: "III",
    trialType: "Randomized Controlled Trial",
    indication: "Atrial Fibrillation",
    sampleSize: 1850,
    randomization: "Computer-generated random sequence with block randomization",
    blinding: "Double-blind (participants and investigators)",
    primaryEndpoint: "Composite of stroke and systemic embolism",
    secondaryEndpoint: "Major bleeding, cardiovascular death, all-cause mortality",
    keyResults: "The novel anticoagulant reduced the risk of stroke by 21% compared to warfarin (HR 0.79, 95% CI 0.66-0.94, P=0.009). Major bleeding rates were similar between groups (3.2% vs 3.5%, P=0.45).",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { HR: 0.79, CI: [0.66, 0.94], pValue: 0.009 },
      majorBleeding: { rate1: 0.032, rate2: 0.035, pValue: 0.45 }
    }),
    conclusion: "In patients with atrial fibrillation, the novel anticoagulant was superior to warfarin in preventing stroke with similar bleeding risk.",
    abstractText: "Background: Atrial fibrillation increases stroke risk. Novel anticoagulants may offer advantages over warfarin. Methods: We conducted a multicenter, randomized, double-blind trial comparing a novel anticoagulant with warfarin in 1850 patients with atrial fibrillation. Results: The primary outcome occurred in 1.7% of the novel anticoagulant group versus 2.2% of the warfarin group (HR 0.79, 95% CI 0.66-0.94, P=0.009). Conclusions: The novel anticoagulant was superior to warfarin in stroke prevention.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2024001"
  },
  {
    title: "Immunotherapy Combination for Advanced Non-Small Cell Lung Cancer: Phase III Trial Results",
    authors: "Chen L, Anderson K, Martinez P, et al.",
    journal: "The Lancet",
    doi: "10.1016/S0140-6736(24)00001-X",
    pubmedId: "35000002",
    publicationDate: new Date("2024-02-01"),
    trialPhase: "III",
    trialType: "Open-label Randomized Trial",
    indication: "Non-Small Cell Lung Cancer",
    sampleSize: 680,
    randomization: "Stratified randomization by PD-L1 expression",
    blinding: "Open-label",
    primaryEndpoint: "Overall survival",
    secondaryEndpoint: "Progression-free survival, objective response rate",
    keyResults: "Median overall survival was 22.1 months with combination therapy versus 14.7 months with chemotherapy alone (HR 0.64, 95% CI 0.52-0.78, P<0.001). Grade 3-4 adverse events occurred in 58% vs 41%.",
    statisticalMetrics: JSON.stringify({
      overallSurvival: { median1: 22.1, median2: 14.7, HR: 0.64, CI: [0.52, 0.78], pValue: 0.0001 },
      adverseEvents: { grade34_1: 0.58, grade34_2: 0.41 }
    }),
    conclusion: "Immunotherapy combination significantly improved overall survival in advanced NSCLC but with increased toxicity.",
    abstractText: "Background: Immunotherapy has transformed lung cancer treatment. We evaluated combination immunotherapy versus chemotherapy. Methods: 680 patients with advanced NSCLC were randomized to combination immunotherapy or chemotherapy. Results: Median OS was 22.1 vs 14.7 months (HR 0.64, P<0.001). Conclusions: Combination therapy improved survival with manageable toxicity.",
    sourceUrl: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(24)00001-X"
  },
  {
    title: "Early Intensive Blood Pressure Lowering in Acute Stroke: The INTERACT3 Trial",
    authors: "Anderson CS, Huang Y, Lindley RI, et al.",
    journal: "JAMA",
    doi: "10.1001/jama.2024.0001",
    pubmedId: "35000003",
    publicationDate: new Date("2024-01-20"),
    trialPhase: "III",
    trialType: "Randomized Controlled Trial",
    indication: "Acute Intracerebral Hemorrhage",
    sampleSize: 2325,
    randomization: "Web-based central randomization",
    blinding: "Outcome assessor blinded",
    primaryEndpoint: "Death or major disability at 6 months (modified Rankin Scale 3-6)",
    secondaryEndpoint: "Quality of life, serious adverse events",
    keyResults: "Primary outcome occurred in 52% of intensive treatment group versus 55% of standard treatment (OR 0.87, 95% CI 0.75-1.01, P=0.06). No significant difference in serious adverse events.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.52, rate2: 0.55, OR: 0.87, CI: [0.75, 1.01], pValue: 0.06 }
    }),
    conclusion: "Early intensive blood pressure lowering showed a trend toward better outcomes but did not reach statistical significance.",
    abstractText: "Importance: Optimal blood pressure management in acute stroke is uncertain. Objective: To determine whether intensive BP lowering improves outcomes. Design: Randomized trial of 2325 patients. Results: Primary outcome 52% vs 55% (OR 0.87, P=0.06). Conclusions: Intensive BP lowering showed non-significant trend toward benefit.",
    sourceUrl: "https://jamanetwork.com/journals/jama/fullarticle/2024001"
  }
];

async function importData() {
  console.log("Starting sample data import...");
  
  try {
    // Create database connection
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection);
    
    console.log("Connected to database");
    
    // Import trials
    for (const trial of sampleTrials) {
      console.log(`Importing: ${trial.title.substring(0, 50)}...`);
      
      await connection.execute(
        `INSERT INTO trials (
          title, authors, journal, doi, pubmedId, publicationDate, trialPhase, trialType,
          indication, sampleSize, randomization, blinding, primaryEndpoint, secondaryEndpoint,
          keyResults, statisticalMetrics, conclusion, abstractText, sourceUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trial.title,
          trial.authors,
          trial.journal,
          trial.doi,
          trial.pubmedId,
          trial.publicationDate,
          trial.trialPhase,
          trial.trialType,
          trial.indication,
          trial.sampleSize,
          trial.randomization,
          trial.blinding,
          trial.primaryEndpoint,
          trial.secondaryEndpoint,
          trial.keyResults,
          trial.statisticalMetrics,
          trial.conclusion,
          trial.abstractText,
          trial.sourceUrl
        ]
      );
      
      console.log("✓ Imported successfully");
    }
    
    await connection.end();
    
    console.log("\n✓ Sample data import completed successfully!");
    console.log(`Imported ${sampleTrials.length} clinical trials`);
    
  } catch (error) {
    console.error("Error importing sample data:", error);
    process.exit(1);
  }
}

importData();
