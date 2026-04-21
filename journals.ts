/**
 * High Impact Factor Clinical Journals (IF ≥ 10)
 * Based on latest impact factor rankings
 */

export const HIGH_IMPACT_JOURNALS = [
  // Top Tier (IF > 100)
  { name: "CA: A Cancer Journal for Clinicians", shortName: "CA Cancer J Clin", if: 232.4 },
  { name: "New England Journal of Medicine", shortName: "NEJM", if: 163.2 },
  { name: "The Lancet", shortName: "Lancet", if: 172.3 },
  { name: "Nature Reviews Drug Discovery", shortName: "Nat Rev Drug Discov", if: 101.8 },
  
  // Very High Impact (IF 50-100)
  { name: "Nature Medicine", shortName: "Nat Med", if: 91.1 },
  { name: "Nature Reviews Clinical Oncology", shortName: "Nat Rev Clin Oncol", if: 82.2 },
  { name: "Cell Metabolism", shortName: "Cell Metab", if: 58.0 },
  { name: "Annals of Oncology", shortName: "Ann Oncol", if: 65.4 },
  { name: "World Psychiatry", shortName: "World Psychiatry", if: 65.8 },
  { name: "Annual Review of Immunology", shortName: "Annu Rev Immunol", if: 65.0 },
  
  // High Impact (IF 30-50)
  { name: "JAMA", shortName: "JAMA", if: 51.3 },
  { name: "JAMA Internal Medicine", shortName: "JAMA Intern Med", if: 44.4 },
  { name: "JAMA Oncology", shortName: "JAMA Oncol", if: 33.3 },
  { name: "JAMA Cardiology", shortName: "JAMA Cardiol", if: 32.4 },
  { name: "JAMA Psychiatry", shortName: "JAMA Psychiatry", if: 31.4 },
  { name: "JAMA Neurology", shortName: "JAMA Neurol", if: 30.5 },
  { name: "BMJ", shortName: "BMJ", if: 39.9 },
  { name: "Lancet Oncology", shortName: "Lancet Oncol", if: 51.1 },
  { name: "Lancet Neurology", shortName: "Lancet Neurol", if: 48.0 },
  { name: "Lancet Respiratory Medicine", shortName: "Lancet Respir Med", if: 38.7 },
  { name: "Lancet Infectious Diseases", shortName: "Lancet Infect Dis", if: 36.4 },
  { name: "Lancet Diabetes & Endocrinology", shortName: "Lancet Diabetes Endocrinol", if: 35.9 },
  { name: "Lancet Gastroenterology & Hepatology", shortName: "Lancet Gastroenterol Hepatol", if: 34.1 },
  { name: "Lancet Haematology", shortName: "Lancet Haematol", if: 32.6 },
  { name: "Lancet HIV", shortName: "Lancet HIV", if: 30.8 },
  { name: "Lancet Public Health", shortName: "Lancet Public Health", if: 33.9 },
  { name: "Circulation", shortName: "Circulation", if: 37.8 },
  { name: "European Heart Journal", shortName: "Eur Heart J", if: 35.8 },
  { name: "Journal of Clinical Oncology", shortName: "J Clin Oncol", if: 45.3 },
  { name: "Annals of Internal Medicine", shortName: "Ann Intern Med", if: 39.2 },
  
  // Significant Impact (IF 20-30)
  { name: "Journal of the American College of Cardiology", shortName: "J Am Coll Cardiol", if: 28.4 },
  { name: "Gut", shortName: "Gut", if: 27.0 },
  { name: "Gastroenterology", shortName: "Gastroenterology", if: 29.4 },
  { name: "Hepatology", shortName: "Hepatology", if: 25.7 },
  { name: "Diabetes Care", shortName: "Diabetes Care", if: 20.8 },
  { name: "Nature Communications", shortName: "Nat Commun", if: 24.9 },
  { name: "Annals of Neurology", shortName: "Ann Neurol", if: 24.0 },
  { name: "Brain", shortName: "Brain", if: 24.8 },
  { name: "Radiology", shortName: "Radiology", if: 29.1 },
  { name: "Journal of Hepatology", shortName: "J Hepatol", if: 25.7 },
  { name: "American Journal of Respiratory and Critical Care Medicine", shortName: "Am J Respir Crit Care Med", if: 24.7 },
  { name: "Kidney International", shortName: "Kidney Int", if: 19.6 },
  { name: "Journal of Allergy and Clinical Immunology", shortName: "J Allergy Clin Immunol", if: 21.7 },
  { name: "Annals of Surgery", shortName: "Ann Surg", if: 23.4 },
  { name: "Blood", shortName: "Blood", if: 25.5 },
  { name: "Leukemia", shortName: "Leukemia", if: 20.8 },
  { name: "Clinical Infectious Diseases", shortName: "Clin Infect Dis", if: 20.5 },
  
  // Notable Impact (IF 10-20)
  { name: "Chest", shortName: "Chest", if: 13.7 },
  { name: "Thorax", shortName: "Thorax", if: 15.9 },
  { name: "Stroke", shortName: "Stroke", if: 10.2 },
  { name: "Neurology", shortName: "Neurology", if: 12.7 },
  { name: "Journal of Clinical Investigation", shortName: "J Clin Invest", if: 15.9 },
  { name: "Arthritis & Rheumatology", shortName: "Arthritis Rheumatol", if: 11.4 },
  { name: "Annals of the Rheumatic Diseases", shortName: "Ann Rheum Dis", if: 20.3 },
  { name: "Intensive Care Medicine", shortName: "Intensive Care Med", if: 17.0 },
  { name: "Critical Care Medicine", shortName: "Crit Care Med", if: 11.5 },
  { name: "Allergy", shortName: "Allergy", if: 14.7 },
  { name: "Journal of the National Cancer Institute", shortName: "J Natl Cancer Inst", if: 12.4 },
  { name: "Cancer Cell", shortName: "Cancer Cell", if: 48.8 },
  { name: "Cell Reports Medicine", shortName: "Cell Rep Med", if: 14.3 },
  { name: "eBioMedicine", shortName: "eBioMedicine", if: 11.1 },
  { name: "EClinicalMedicine", shortName: "EClinicalMedicine", if: 15.1 },
  { name: "PLOS Medicine", shortName: "PLoS Med", if: 13.8 },
  { name: "Molecular Psychiatry", shortName: "Mol Psychiatry", if: 12.3 },
  { name: "American Journal of Psychiatry", shortName: "Am J Psychiatry", if: 18.9 },
  { name: "Biological Psychiatry", shortName: "Biol Psychiatry", if: 12.8 },
  { name: "Hypertension", shortName: "Hypertension", if: 10.3 },
  { name: "Arteriosclerosis, Thrombosis, and Vascular Biology", shortName: "Arterioscler Thromb Vasc Biol", if: 10.5 },
  { name: "Diabetes", shortName: "Diabetes", if: 10.6 },
  { name: "Diabetologia", shortName: "Diabetologia", if: 10.5 },
  { name: "Journal of Bone and Mineral Research", shortName: "J Bone Miner Res", if: 11.4 },
  { name: "Rheumatology", shortName: "Rheumatology", if: 10.0 },
  { name: "Clinical Cancer Research", shortName: "Clin Cancer Res", if: 13.8 },
  { name: "Cancer Research", shortName: "Cancer Res", if: 13.3 },
  { name: "Journal of Immunotherapy for Cancer", shortName: "J Immunother Cancer", if: 12.5 },
  { name: "Annals of Surgical Oncology", shortName: "Ann Surg Oncol", if: 10.5 },
  { name: "Journal of Infectious Diseases", shortName: "J Infect Dis", if: 10.5 },
  { name: "Emerging Infectious Diseases", shortName: "Emerg Infect Dis", if: 16.8 },
  { name: "Clinical Microbiology Reviews", shortName: "Clin Microbiol Rev", if: 23.9 },
  { name: "Pediatrics", shortName: "Pediatrics", if: 10.5 },
  { name: "JAMA Pediatrics", shortName: "JAMA Pediatr", if: 27.5 },
  { name: "Obstetrics & Gynecology", shortName: "Obstet Gynecol", if: 10.8 },
  { name: "American Journal of Obstetrics & Gynecology", shortName: "Am J Obstet Gynecol", if: 10.7 },
  { name: "Ophthalmology", shortName: "Ophthalmology", if: 13.7 },
  { name: "JAMA Ophthalmology", shortName: "JAMA Ophthalmol", if: 11.4 },
  { name: "Journal of the American Academy of Dermatology", shortName: "J Am Acad Dermatol", if: 15.5 },
  { name: "British Journal of Dermatology", shortName: "Br J Dermatol", if: 11.0 },
  { name: "Journal of Urology", shortName: "J Urol", if: 10.3 },
  { name: "European Urology", shortName: "Eur Urol", if: 25.3 },
  { name: "Anesthesiology", shortName: "Anesthesiology", if: 10.7 },
  { name: "Pain", shortName: "Pain", if: 10.0 },
];

export const JOURNAL_NAMES = HIGH_IMPACT_JOURNALS.map(j => j.name);
export const JOURNAL_SHORT_NAMES = HIGH_IMPACT_JOURNALS.map(j => j.shortName);

export function getJournalIF(journalName: string): number | null {
  const journal = HIGH_IMPACT_JOURNALS.find(
    j => j.name === journalName || j.shortName === journalName
  );
  return journal?.if || null;
}

export function isHighImpactJournal(journalName: string): boolean {
  return HIGH_IMPACT_JOURNALS.some(
    j => j.name === journalName || j.shortName === journalName
  );
}
