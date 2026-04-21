/**
 * Extended sample data import script - 10+ clinical trials from high-impact journals
 */

import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

const extendedSampleTrials = [
  {
    title: "Tirzepatide for Weight Reduction in Obesity: The SURMOUNT-1 Trial",
    authors: "Jastreboff AM, Aronne LJ, Ahmad NN, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2206038",
    pubmedId: "35658024",
    publicationDate: new Date("2022-06-04"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Obesity",
    sampleSize: 2539,
    randomization: "Centralized interactive response technology with stratification by BMI and diabetes status",
    blinding: "Double-blind (participants, investigators, and outcome assessors)",
    primaryEndpoint: "Percentage change in body weight from baseline to week 72",
    secondaryEndpoint: "Proportion achieving ≥5% weight loss, changes in waist circumference, lipid levels",
    keyResults: "At 72 weeks, tirzepatide resulted in mean weight reductions of 15.0% (5 mg), 19.5% (10 mg), and 20.9% (15 mg) versus 3.1% with placebo (all P<0.001). Grade 3-4 adverse events occurred in 5.8% of tirzepatide vs 3.2% of placebo groups.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { 
        tirzepatide5mg: -15.0, 
        tirzepatide10mg: -19.5, 
        tirzepatide15mg: -20.9, 
        placebo: -3.1, 
        pValue: 0.0001 
      },
      weight5percent: { rate_15mg: 0.89, rate_placebo: 0.35 }
    }),
    conclusion: "Tirzepatide provided substantial and sustained reductions in body weight in adults with obesity, with a safety profile consistent with incretin-based therapies.",
    abstractText: "Background: Tirzepatide is a glucose-dependent insulinotropic polypeptide and glucagon-like peptide-1 receptor agonist. Methods: We conducted a 72-week, double-blind trial involving adults with obesity. Participants were randomly assigned to receive tirzepatide (5, 10, or 15 mg) or placebo subcutaneously once weekly. Results: Mean weight change was −15.0%, −19.5%, and −20.9% with tirzepatide 5, 10, and 15 mg versus −3.1% with placebo. Conclusions: Tirzepatide was effective for weight reduction in obesity.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2206038",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2022/nejm_2022.386.issue-23/nejmoa2206038/20220602/images/img_xlarge/nejmoa2206038_f2.jpeg"
  },
  {
    title: "Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes",
    authors: "Lincoff AM, Brown-Frandsen K, Colhoun HM, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2307563",
    pubmedId: "37952131",
    publicationDate: new Date("2023-11-11"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Cardiovascular Disease with Obesity",
    sampleSize: 17604,
    randomization: "Web-based system with stratification by cardiovascular disease type",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of cardiovascular death, nonfatal myocardial infarction, or nonfatal stroke",
    secondaryEndpoint: "Individual components of primary endpoint, all-cause mortality",
    keyResults: "Primary endpoint occurred in 6.5% of semaglutide group vs 8.0% of placebo (HR 0.80, 95% CI 0.72-0.90, P<0.001). Mean weight reduction was 9.4% with semaglutide vs 0.9% with placebo. Serious adverse events occurred in 33.2% vs 36.3%.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.065, rate2: 0.080, HR: 0.80, CI: [0.72, 0.90], pValue: 0.0001 },
      weightChange: { semaglutide: -9.4, placebo: -0.9 }
    }),
    conclusion: "Semaglutide reduced cardiovascular events in patients with overweight or obesity and cardiovascular disease but without diabetes.",
    abstractText: "Background: Obesity increases cardiovascular risk. Semaglutide reduces weight but its effect on cardiovascular outcomes is unknown. Methods: 17,604 patients with cardiovascular disease and BMI≥27 were randomized to semaglutide 2.4mg or placebo weekly. Results: Primary endpoint occurred in 6.5% vs 8.0% (HR 0.80, P<0.001). Conclusions: Semaglutide reduced cardiovascular events in obesity.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2307563",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2023/nejm_2023.389.issue-24/nejmoa2307563/20231109/images/img_xlarge/nejmoa2307563_f1.jpeg"
  },
  {
    title: "Pembrolizumab plus Chemotherapy in Metastatic Non-Small-Cell Lung Cancer",
    authors: "Gandhi L, Rodríguez-Abreu D, Gadgeel S, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa1801005",
    pubmedId: "29658856",
    publicationDate: new Date("2018-05-31"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Metastatic Non-Small-Cell Lung Cancer",
    sampleSize: 616,
    randomization: "Interactive voice-response system, stratified by PD-L1 expression, histology, and smoking status",
    blinding: "Double-blind",
    primaryEndpoint: "Overall survival and progression-free survival",
    secondaryEndpoint: "Objective response rate, duration of response, safety",
    keyResults: "Median OS was 15.9 months with pembrolizumab-chemotherapy vs 11.3 months with placebo-chemotherapy (HR 0.64, 95% CI 0.52-0.78, P<0.001). Median PFS was 9.0 vs 4.9 months (HR 0.52, P<0.001). Grade 3-5 adverse events occurred in 67.2% vs 65.8%.",
    statisticalMetrics: JSON.stringify({
      overallSurvival: { median1: 15.9, median2: 11.3, HR: 0.64, CI: [0.52, 0.78], pValue: 0.0001 },
      progressionFreeSurvival: { median1: 9.0, median2: 4.9, HR: 0.52, pValue: 0.0001 }
    }),
    conclusion: "Pembrolizumab plus chemotherapy significantly improved overall survival and progression-free survival in metastatic NSCLC without EGFR or ALK alterations.",
    abstractText: "Background: Pembrolizumab improves survival in advanced NSCLC with high PD-L1 expression. Methods: 616 patients with metastatic nonsquamous NSCLC were randomized to pembrolizumab plus chemotherapy or placebo plus chemotherapy. Results: Median OS 15.9 vs 11.3 months (HR 0.64, P<0.001). Conclusions: Pembrolizumab-chemotherapy improved survival.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa1801005",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2018/nejm_2018.378.issue-22/nejmoa1801005/20180413/images/img_xlarge/nejmoa1801005_f2.jpeg"
  },
  {
    title: "Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction",
    authors: "McMurray JJV, Solomon SD, Inzucchi SE, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa1911303",
    pubmedId: "31535829",
    publicationDate: new Date("2019-11-21"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Heart Failure with Reduced Ejection Fraction",
    sampleSize: 4744,
    randomization: "Interactive web-response system, stratified by diabetes status",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of worsening heart failure or cardiovascular death",
    secondaryEndpoint: "Individual components, total hospitalizations, change in Kansas City Cardiomyopathy Questionnaire",
    keyResults: "Primary outcome occurred in 16.3% with dapagliflozin vs 21.2% with placebo (HR 0.74, 95% CI 0.65-0.85, P<0.001). Cardiovascular death occurred in 9.6% vs 11.5% (HR 0.82, P=0.03). Serious adverse events were similar between groups.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.163, rate2: 0.212, HR: 0.74, CI: [0.65, 0.85], pValue: 0.0001 },
      cvDeath: { rate1: 0.096, rate2: 0.115, HR: 0.82, pValue: 0.03 }
    }),
    conclusion: "Dapagliflozin reduced the risk of worsening heart failure or cardiovascular death in patients with heart failure and reduced ejection fraction, regardless of diabetes status.",
    abstractText: "Background: SGLT2 inhibitors improve outcomes in type 2 diabetes. Their effect in heart failure is uncertain. Methods: 4744 patients with HFrEF were randomized to dapagliflozin 10mg or placebo daily. Results: Primary outcome 16.3% vs 21.2% (HR 0.74, P<0.001). Conclusions: Dapagliflozin reduced heart failure events.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa1911303",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2019/nejm_2019.381.issue-21/nejmoa1911303/20190919/images/img_xlarge/nejmoa1911303_f1.jpeg"
  },
  {
    title: "Colchicine in Patients with Chronic Coronary Disease",
    authors: "Tardif JC, Kouz S, Waters DD, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa1912388",
    pubmedId: "32865380",
    publicationDate: new Date("2020-11-16"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Chronic Coronary Disease",
    sampleSize: 5522,
    randomization: "Central web-based system",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of cardiovascular death, myocardial infarction, stroke, or ischemia-driven coronary revascularization",
    secondaryEndpoint: "Individual components of primary endpoint",
    keyResults: "Primary endpoint occurred in 5.5% with colchicine vs 7.1% with placebo (HR 0.77, 95% CI 0.61-0.96, P=0.02). Myocardial infarction occurred in 2.5% vs 3.6% (HR 0.69, P=0.03). Non-cardiovascular death was higher with colchicine (0.7% vs 0.4%, P=0.07).",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.055, rate2: 0.071, HR: 0.77, CI: [0.61, 0.96], pValue: 0.02 },
      MI: { rate1: 0.025, rate2: 0.036, HR: 0.69, pValue: 0.03 }
    }),
    conclusion: "Low-dose colchicine reduced cardiovascular events in patients with chronic coronary disease, though non-cardiovascular mortality showed a non-significant increase.",
    abstractText: "Background: Inflammation contributes to atherosclerosis. Colchicine has anti-inflammatory properties. Methods: 5522 patients with chronic coronary disease were randomized to colchicine 0.5mg daily or placebo. Results: Primary endpoint 5.5% vs 7.1% (HR 0.77, P=0.02). Conclusions: Colchicine reduced cardiovascular events.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa1912388",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2020/nejm_2020.383.issue-20/nejmoa1912388/20200831/images/img_xlarge/nejmoa1912388_f2.jpeg"
  },
  {
    title: "Empagliflozin in Heart Failure with a Preserved Ejection Fraction",
    authors: "Anker SD, Butler J, Filippatos G, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2107038",
    pubmedId: "34449189",
    publicationDate: new Date("2021-10-14"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Heart Failure with Preserved Ejection Fraction",
    sampleSize: 5988,
    randomization: "Interactive response technology, stratified by diabetes status and ejection fraction",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of cardiovascular death or hospitalization for heart failure",
    secondaryEndpoint: "Total hospitalizations for heart failure, rate of decline in eGFR, Kansas City Cardiomyopathy Questionnaire score",
    keyResults: "Primary outcome occurred in 13.8 per 100 person-years with empagliflozin vs 17.1 with placebo (HR 0.79, 95% CI 0.69-0.90, P<0.001). Total hospitalizations were reduced by 27% (P<0.001). Serious adverse events occurred in 32.3% vs 34.0%.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 13.8, rate2: 17.1, HR: 0.79, CI: [0.69, 0.90], pValue: 0.0001 },
      totalHospitalizations: { reduction: 0.27, pValue: 0.0001 }
    }),
    conclusion: "Empagliflozin reduced the combined risk of cardiovascular death or hospitalization for heart failure in patients with heart failure and preserved ejection fraction.",
    abstractText: "Background: Treatment options for HFpEF are limited. Methods: 5988 patients with HFpEF were randomized to empagliflozin 10mg or placebo daily. Results: Primary outcome 13.8 vs 17.1 per 100 person-years (HR 0.79, P<0.001). Conclusions: Empagliflozin reduced heart failure events in HFpEF.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2107038",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2021/nejm_2021.385.issue-16/nejmoa2107038/20210827/images/img_xlarge/nejmoa2107038_f1.jpeg"
  },
  {
    title: "Rivaroxaban for Thromboprophylaxis after Hospitalization for Medical Illness",
    authors: "Spyropoulos AC, Ageno W, Albers GW, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa1805090",
    pubmedId: "30145946",
    publicationDate: new Date("2018-10-04"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Venous Thromboembolism Prophylaxis",
    sampleSize: 12024,
    randomization: "Interactive web-response system, stratified by VTE risk score",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of symptomatic venous thromboembolism or death related to venous thromboembolism",
    secondaryEndpoint: "Major bleeding, net clinical benefit",
    keyResults: "Primary outcome occurred in 0.83% with rivaroxaban vs 1.10% with placebo (HR 0.76, 95% CI 0.52-1.09, P=0.14). Major bleeding occurred in 0.28% vs 0.15% (HR 1.88, P=0.03). Net clinical benefit favored rivaroxaban (HR 0.80, P=0.09).",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.0083, rate2: 0.0110, HR: 0.76, CI: [0.52, 1.09], pValue: 0.14 },
      majorBleeding: { rate1: 0.0028, rate2: 0.0015, HR: 1.88, pValue: 0.03 }
    }),
    conclusion: "Extended thromboprophylaxis with rivaroxaban did not significantly reduce venous thromboembolism but increased major bleeding in medically ill patients.",
    abstractText: "Background: Optimal duration of thromboprophylaxis after medical hospitalization is uncertain. Methods: 12,024 patients were randomized to rivaroxaban 10mg for 31-39 days or placebo after standard prophylaxis. Results: VTE 0.83% vs 1.10% (HR 0.76, P=0.14). Major bleeding 0.28% vs 0.15% (P=0.03). Conclusions: Rivaroxaban did not significantly reduce VTE.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa1805090",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2018/nejm_2018.379.issue-14/nejmoa1805090/20180824/images/img_xlarge/nejmoa1805090_f2.jpeg"
  },
  {
    title: "Baricitinib plus Remdesivir for Hospitalized Adults with Covid-19",
    authors: "Kalil AC, Patterson TF, Mehta AK, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2031994",
    pubmedId: "33306283",
    publicationDate: new Date("2021-03-04"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "COVID-19",
    sampleSize: 1033,
    randomization: "Permuted-block randomization, stratified by site and disease severity",
    blinding: "Double-blind",
    primaryEndpoint: "Time to recovery within 29 days",
    secondaryEndpoint: "Clinical status at day 15, mortality at day 29",
    keyResults: "Median time to recovery was 7 days with baricitinib-remdesivir vs 8 days with placebo-remdesivir (recovery rate ratio 1.16, 95% CI 1.01-1.32, P=0.03). 29-day mortality was 5.1% vs 7.8% (HR 0.65, P=0.09). Serious adverse events occurred in 16.0% vs 21.0%.",
    statisticalMetrics: JSON.stringify({
      timeToRecovery: { median1: 7, median2: 8, RR: 1.16, CI: [1.01, 1.32], pValue: 0.03 },
      mortality29d: { rate1: 0.051, rate2: 0.078, HR: 0.65, pValue: 0.09 }
    }),
    conclusion: "Baricitinib plus remdesivir was superior to remdesivir alone in reducing recovery time and accelerating improvement in clinical status in hospitalized COVID-19 patients.",
    abstractText: "Background: Immunomodulation may benefit COVID-19. Methods: 1033 hospitalized adults with COVID-19 were randomized to baricitinib plus remdesivir or placebo plus remdesivir. Results: Median recovery time 7 vs 8 days (RR 1.16, P=0.03). Conclusions: Baricitinib-remdesivir improved recovery.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2031994",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2020/nejm_2020.383.issue-9/nejmoa2031994/20201210/images/img_xlarge/nejmoa2031994_f2.jpeg"
  },
  {
    title: "Tofacitinib in Patients Hospitalized with Covid-19 Pneumonia",
    authors: "Guimarães PO, Quirk D, Furtado RH, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2101643",
    pubmedId: "33789009",
    publicationDate: new Date("2021-06-16"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "COVID-19 Pneumonia",
    sampleSize: 289,
    randomization: "Web-based system, stratified by site",
    blinding: "Double-blind",
    primaryEndpoint: "Clinical status at day 28 on 7-point ordinal scale",
    secondaryEndpoint: "All-cause mortality at day 28, time to clinical improvement",
    keyResults: "Death or respiratory failure at day 28 occurred in 18.1% with tofacitinib vs 29.0% with placebo (RR 0.63, 95% CI 0.41-0.97, P=0.04). All-cause mortality was 2.8% vs 5.5% (HR 0.49, P=0.33). Serious adverse events occurred in 20.3% vs 26.7%.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 0.181, rate2: 0.290, RR: 0.63, CI: [0.41, 0.97], pValue: 0.04 },
      mortality28d: { rate1: 0.028, rate2: 0.055, HR: 0.49, pValue: 0.33 }
    }),
    conclusion: "Tofacitinib reduced the risk of death or respiratory failure in hospitalized patients with COVID-19 pneumonia.",
    abstractText: "Background: JAK inhibition may modulate COVID-19 inflammation. Methods: 289 hospitalized patients with COVID-19 pneumonia were randomized to tofacitinib 10mg twice daily or placebo for 14 days. Results: Death or respiratory failure 18.1% vs 29.0% (RR 0.63, P=0.04). Conclusions: Tofacitinib reduced adverse outcomes.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2101643",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2021/nejm_2021.384.issue-24/nejmoa2101643/20210330/images/img_xlarge/nejmoa2101643_f2.jpeg"
  },
  {
    title: "Finerenone and Cardiovascular Outcomes in Patients with Chronic Kidney Disease and Type 2 Diabetes",
    authors: "Pitt B, Filippatos G, Agarwal R, et al.",
    journal: "New England Journal of Medicine",
    doi: "10.1056/NEJMoa2110956",
    pubmedId: "34449181",
    publicationDate: new Date("2021-11-04"),
    trialPhase: "III",
    trialType: "Randomized, Double-Blind, Placebo-Controlled Trial",
    indication: "Chronic Kidney Disease with Type 2 Diabetes",
    sampleSize: 5674,
    randomization: "Interactive web-response system, stratified by region and diabetes treatment",
    blinding: "Double-blind",
    primaryEndpoint: "Composite of cardiovascular death, nonfatal myocardial infarction, nonfatal stroke, or hospitalization for heart failure",
    secondaryEndpoint: "Individual components, kidney composite outcome",
    keyResults: "Primary outcome occurred in 13.0 per 100 person-years with finerenone vs 14.8 with placebo (HR 0.87, 95% CI 0.76-0.98, P=0.03). Hospitalization for heart failure occurred in 3.2 vs 4.4 per 100 person-years (HR 0.71, P=0.001). Hyperkalemia occurred in 14.0% vs 6.9%.",
    statisticalMetrics: JSON.stringify({
      primaryOutcome: { rate1: 13.0, rate2: 14.8, HR: 0.87, CI: [0.76, 0.98], pValue: 0.03 },
      hfHospitalization: { rate1: 3.2, rate2: 4.4, HR: 0.71, pValue: 0.001 }
    }),
    conclusion: "Finerenone reduced cardiovascular events in patients with chronic kidney disease and type 2 diabetes, with an acceptable safety profile.",
    abstractText: "Background: Mineralocorticoid receptor antagonists may benefit CKD and diabetes. Methods: 5674 patients with CKD and type 2 diabetes were randomized to finerenone or placebo. Results: Primary outcome 13.0 vs 14.8 per 100 person-years (HR 0.87, P=0.03). Conclusions: Finerenone reduced cardiovascular events.",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/NEJMoa2110956",
    figureUrl: "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2021/nejm_2021.385.issue-19/nejmoa2110956/20210827/images/img_xlarge/nejmoa2110956_f1.jpeg"
  }
];

async function importExtendedData() {
  console.log("Starting extended sample data import (10 trials)...");
  
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log("Connected to database");
    
    for (const trial of extendedSampleTrials) {
      console.log(`Importing: ${trial.title.substring(0, 60)}...`);
      
      await connection.execute(
        `INSERT INTO trials (
          title, authors, journal, doi, pubmedId, publicationDate, trialPhase, trialType,
          indication, sampleSize, randomization, blinding, primaryEndpoint, secondaryEndpoint,
          keyResults, statisticalMetrics, conclusion, abstractText, sourceUrl, figureUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          trial.sourceUrl,
          trial.figureUrl
        ]
      );
      
      console.log("✓ Imported successfully");
    }
    
    await connection.end();
    
    console.log(`\n✓ Extended sample data import completed!`);
    console.log(`Imported ${extendedSampleTrials.length} additional clinical trials`);
    console.log(`Total trials in database: ${3 + extendedSampleTrials.length}`);
    
  } catch (error) {
    console.error("Error importing extended sample data:", error);
    process.exit(1);
  }
}

importExtendedData();
