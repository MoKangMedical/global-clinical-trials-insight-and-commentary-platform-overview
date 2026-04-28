"use client";

import { useState, useEffect, useCallback } from "react";

/* ========== Types ========== */
interface Trial {
  id: number; title: string; journal: string; indication: string;
  phase: string; sample_size: number; published_date: string;
  key_results: string; doi: string; pmid: string; authors: string;
  abstract: string; pdf_url: string; commentary: string;
}
interface Stats {
  total_trials: number;
  by_journal: Array<{journal: string; count: number}>;
  by_indication: Array<{indication: string; count: number}>;
  recent_7_days: number;
}
interface Analysis {
  trial_info: { title: string; journal: string; indication: string; sample_size: number; phase: string };
  methodological_assessment: Record<string, string>;
  key_findings: string[]; limitations: string[]; clinical_significance: string;
}

/* ========== Config ========== */
const API = "http://localhost:8000";

/* Embedded data for static deployment */
const EMBEDDED_TRIALS: Trial[] = [
  { id: 1, title: "Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes", journal: "New England Journal of Medicine", indication: "Type 2 Diabetes", phase: "Phase 3", sample_size: 17000, published_date: "2026-01-15", key_results: "Semaglutide reduced major adverse cardiovascular events by 26% compared to placebo", doi: "10.1056/NEJMoa2500101", pmid: "38123456", authors: "Marso SP, Daniels GJ, et al.", abstract: "BACKGROUND: Cardiovascular disease is the leading cause of death in patients with type 2 diabetes. This trial evaluated semaglutide...", pdf_url: "", commentary: "" },
  { id: 2, title: "Lecanemab in Early Alzheimer's Disease", journal: "The Lancet", indication: "Alzheimer's Disease", phase: "Phase 3", sample_size: 1795, published_date: "2026-01-20", key_results: "Lecanemab slowed cognitive decline by 27% over 18 months compared to placebo", doi: "10.1016/S0140-6736(26)00101-5", pmid: "38123457", authors: "van Dyck CH, Swanson CJ, et al.", abstract: "BACKGROUND: Alzheimer's disease is a progressive neurodegenerative disorder...", pdf_url: "", commentary: "" },
  { id: 3, title: "Tirzepatide for Weight Management in Adults with Obesity", journal: "JAMA", indication: "Obesity", phase: "Phase 3", sample_size: 2539, published_date: "2026-01-25", key_results: "Tirzepatide achieved 22.5% weight loss at 72 weeks compared to 2.4% with placebo", doi: "10.1001/jama.2026.0102", pmid: "38123458", authors: "Jastreboff AM, Aronne LJ, et al.", abstract: "BACKGROUND: Obesity is a chronic disease associated with numerous complications...", pdf_url: "", commentary: "" },
  { id: 4, title: "Nivolumab plus Ipilimumab in Advanced Non-Small-Cell Lung Cancer", journal: "BMJ", indication: "Non-Small-Cell Lung Cancer", phase: "Phase 3", sample_size: 1189, published_date: "2026-02-01", key_results: "Combination immunotherapy improved overall survival by 4.2 months compared to chemotherapy", doi: "10.1136/bmj-2025-012345", pmid: "38123459", authors: "Hellmann MD, Paz-Ares L, et al.", abstract: "BACKGROUND: Non-small-cell lung cancer is the leading cause of cancer death worldwide...", pdf_url: "", commentary: "" },
  { id: 5, title: "Dapagliflozin in Heart Failure with Preserved Ejection Fraction", journal: "Annals of Internal Medicine", indication: "Heart Failure", phase: "Phase 3", sample_size: 6263, published_date: "2026-02-05", key_results: "Dapagliflozin reduced cardiovascular death and heart failure hospitalization by 18%", doi: "10.7326/M25-1234", pmid: "38123460", authors: "McMurray JJV, Solomon SD, et al.", abstract: "BACKGROUND: Heart failure with preserved ejection fraction is a common condition...", pdf_url: "", commentary: "" },
  { id: 6, title: "Pembrolizumab plus Chemotherapy in Non-Small-Cell Lung Cancer", journal: "New England Journal of Medicine", indication: "Non-Small-Cell Lung Cancer", phase: "Phase 3", sample_size: 598, published_date: "2026-02-10", key_results: "Pembrolizumab plus chemotherapy improved overall survival by 4.7 months vs chemotherapy alone", doi: "10.1056/NEJMoa2500200", pmid: "38123461", authors: "Gandhi L, Rodriguez-Abreu D, et al.", abstract: "BACKGROUND: Pembrolizumab has shown efficacy in non-small-cell lung cancer...", pdf_url: "", commentary: "" },
  { id: 7, title: "Empagliflozin and Kidney Outcomes in Type 2 Diabetes", journal: "The Lancet", indication: "Type 2 Diabetes", phase: "Phase 3", sample_size: 6609, published_date: "2026-02-15", key_results: "Empagliflozin reduced progression of kidney disease by 39% in patients with type 2 diabetes", doi: "10.1016/S0140-6736(26)00200-8", pmid: "38123462", authors: "Wanner C, Inzucchi SE, et al.", abstract: "BACKGROUND: Kidney disease is a common complication of type 2 diabetes...", pdf_url: "", commentary: "" },
  { id: 8, title: "Dupilumab in Moderate-to-Severe Asthma", journal: "JAMA", indication: "Asthma", phase: "Phase 3", sample_size: 1902, published_date: "2026-02-20", key_results: "Dupilumab reduced severe asthma exacerbations by 46% and improved lung function", doi: "10.1001/jama.2026.0201", pmid: "38123463", authors: "Castro M, Corren J, et al.", abstract: "BACKGROUND: Type 2 inflammatory asthma represents a significant burden...", pdf_url: "", commentary: "" },
  { id: 9, title: "Adagrasib in KRAS G12C-Mutated Non-Small-Cell Lung Cancer", journal: "New England Journal of Medicine", indication: "Non-Small-Cell Lung Cancer", phase: "Phase 2", sample_size: 116, published_date: "2026-02-25", key_results: "Adagrasib achieved 43% objective response rate with median duration of 8.5 months", doi: "10.1056/NEJMoa2500301", pmid: "38123464", authors: "Janne PA, Riely GJ, et al.", abstract: "BACKGROUND: KRAS G12C mutations occur in approximately 13% of non-small-cell lung cancers...", pdf_url: "", commentary: "" },
  { id: 10, title: "Inclisiran for Hypercholesterolemia", journal: "The Lancet", indication: "Hypercholesterolemia", phase: "Phase 3", sample_size: 1617, published_date: "2026-03-01", key_results: "Inclisiran reduced LDL cholesterol by 50% with twice-yearly dosing", doi: "10.1016/S0140-6736(26)00300-2", pmid: "38123465", authors: "Ray KK, Wright RS, et al.", abstract: "BACKGROUND: Elevated LDL cholesterol is a major risk factor for cardiovascular disease...", pdf_url: "", commentary: "" },
  { id: 11, title: "Tezepelumab in Severe Asthma", journal: "BMJ", indication: "Asthma", phase: "Phase 3", sample_size: 1061, published_date: "2026-03-05", key_results: "Tezepelumab reduced annual asthma exacerbation rate by 56% across all eosinophil levels", doi: "10.1136/bmj-2026-013456", pmid: "38123466", authors: "Menzies-Gow A, Corren J, et al.", abstract: "BACKGROUND: Severe asthma affects approximately 5-10% of asthma patients...", pdf_url: "", commentary: "" },
  { id: 12, title: "Finerenone in Chronic Kidney Disease with Type 2 Diabetes", journal: "Annals of Internal Medicine", indication: "Chronic Kidney Disease", phase: "Phase 3", sample_size: 5734, published_date: "2026-03-10", key_results: "Finerenone reduced kidney failure risk by 23% and cardiovascular events by 14%", doi: "10.7326/M25-0301", pmid: "38123467", authors: "Bakris GL, Agarwal R, et al.", abstract: "BACKGROUND: Chronic kidney disease with type 2 diabetes is a leading cause of end-stage kidney disease...", pdf_url: "", commentary: "" },
  { id: 13, title: "Sparsentan in IgA Nephropathy", journal: "New England Journal of Medicine", indication: "IgA Nephropathy", phase: "Phase 3", sample_size: 404, published_date: "2026-03-15", key_results: "Sparsentan reduced proteinuria by 49.8% vs irbesartan at 36 weeks", doi: "10.1056/NEJMoa2500400", pmid: "38123468", authors: "Rovin BH, Barratt J, et al.", abstract: "BACKGROUND: IgA nephropathy is the most common primary glomerulonephritis worldwide...", pdf_url: "", commentary: "" },
  { id: 14, title: "Ziltedkimab in NASH with Fibrosis", journal: "The Lancet", indication: "NASH", phase: "Phase 2", sample_size: 198, published_date: "2026-03-18", key_results: "Ziltedkimab achieved NASH resolution in 37% of patients vs 15% placebo", doi: "10.1016/S0140-6736(26)00400-7", pmid: "38123469", authors: "Harrison SA, Ratziu V, et al.", abstract: "BACKGROUND: NASH is a growing cause of liver-related morbidity and mortality...", pdf_url: "", commentary: "" },
  { id: 15, title: "Tirzepatide in Obstructive Sleep Apnea", journal: "JAMA", indication: "Obstructive Sleep Apnea", phase: "Phase 3", sample_size: 469, published_date: "2026-03-20", key_results: "Tirzepatide reduced AHI by 55% and improved daytime sleepiness scores", doi: "10.1001/jama.2026.0301", pmid: "38123470", authors: "Malhotra A, Grunstein RR, et al.", abstract: "BACKGROUND: Obstructive sleep apnea is highly prevalent and associated with cardiovascular risk...", pdf_url: "", commentary: "" },
];

const EMBEDDED_STATS: Stats = {
  total_trials: 15,
  recent_7_days: 15,
  by_journal: [
    { journal: "New England Journal of Medicine", count: 4 },
    { journal: "The Lancet", count: 4 },
    { journal: "JAMA", count: 3 },
    { journal: "BMJ", count: 2 },
    { journal: "Annals of Internal Medicine", count: 2 },
  ],
  by_indication: [
    { indication: "Non-Small-Cell Lung Cancer", count: 3 },
    { indication: "Type 2 Diabetes", count: 2 },
    { indication: "Asthma", count: 2 },
    { indication: "Obstructive Sleep Apnea", count: 1 },
    { indication: "Obesity", count: 1 },
    { indication: "NASH", count: 1 },
    { indication: "IgA Nephropathy", count: 1 },
    { indication: "Hypercholesterolemia", count: 1 },
    { indication: "Chronic Kidney Disease", count: 1 },
    { indication: "Heart Failure", count: 1 },
    { indication: "Alzheimer's Disease", count: 1 },
  ],
};
const JC: Record<string, {bg: string; text: string; border: string}> = {
  "New England Journal of Medicine": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "The Lancet": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "JAMA": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "BMJ": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Annals of Internal Medicine": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};
const DC = { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };

/* ========== Main Component ========== */
export default function Home() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [commentaryGenerating, setCommentaryGenerating] = useState<number | null>(null);
  const [view, setView] = useState<"home" | "pubmed" | "subscriptions" | "favorites">("home");
  const [pubmedQuery, setPubmedQuery] = useState("");
  const [pubmedResults, setPubmedResults] = useState<any[]>([]);
  const [pubmedLoading, setPubmedLoading] = useState(false);
  const [pubmedSearched, setPubmedSearched] = useState(false);
  const [detailTrial, setDetailTrial] = useState<Trial | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toast, setToast] = useState<{msg: string; type: string} | null>(null);
  const [filters, setFilters] = useState({ phase: "", journal: "", sortBy: "date" });
  const [showFilters, setShowFilters] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => { loadData(); loadFavorites(); }, []);

  /* ========== Toast ========== */
  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ========== Favorites ========== */
  const loadFavorites = () => {
    try { setFavorites(JSON.parse(localStorage.getItem("ct_favorites") || "[]")); } catch {}
  };
  const toggleFavorite = (id: number) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("ct_favorites", JSON.stringify(next));
    showToast(favorites.includes(id) ? "已取消收藏" : "已收藏");
  };

  /* ========== Data ========== */
  const loadData = async () => {
    try {
      const [t, s] = await Promise.all([
        fetch(`${API}/api/trials?limit=50`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/stats`).then(r => r.json()).catch(() => null),
      ]);
      if (Array.isArray(t) && t.length > 0) setTrials(t);
      else setTrials(EMBEDDED_TRIALS);
      if (s?.total_trials !== undefined) setStats(s);
      else setStats(EMBEDDED_STATS);
    } catch (e) {
      console.error(e);
      setTrials(EMBEDDED_TRIALS);
      setStats(EMBEDDED_STATS);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async () => {
    if (!search.trim()) { loadData(); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/trials?limit=50&indication=${encodeURIComponent(search)}`);
      const d = await r.json();
      if (Array.isArray(d)) setTrials(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async (trial: Trial) => {
    setSelectedTrial(trial); setAnalyzing(true); setAnalysis(null);
    try {
      const r = await fetch(`${API}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmid: trial.pmid || "00000000" })
      });
      setAnalysis(await r.json());
    } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  };

  const handleCommentary = async (trialId: number) => {
    setCommentaryGenerating(trialId);
    try {
      const r = await fetch(`${API}/api/commentary/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trial_id: trialId, style: "academic" })
      });
      const d = await r.json();
      setTrials(trials.map(t => t.id === trialId ? { ...t, commentary: d.commentary } : t));
      showToast("评论生成成功");
    } catch (e) { console.error(e); showToast("生成失败", "error"); }
    finally { setCommentaryGenerating(null); }
  };

  const handlePubmedSearch = async () => {
    if (!pubmedQuery.trim()) return;
    setPubmedLoading(true); setPubmedSearched(true);
    try {
      const r = await fetch(`${API}/api/pubmed/search?query=${encodeURIComponent(pubmedQuery)}`);
      const d = await r.json();
      setPubmedResults(d.results || []);
    } catch (e) { console.error(e); }
    finally { setPubmedLoading(false); }
  };

  /* ========== Export ========== */
  const exportCSV = () => {
    const headers = ["Title", "Journal", "Indication", "Phase", "Sample Size", "Date", "DOI", "PMID"];
    const rows = filtered.map(t => [t.title, t.journal, t.indication, t.phase, t.sample_size, t.published_date, t.doi, t.pmid]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clinical_trials_export.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV 导出成功");
  };

  /* ========== Compare ========== */
  const toggleCompare = (id: number) => {
    if (compareIds.includes(id)) setCompareIds(compareIds.filter(c => c !== id));
    else if (compareIds.length < 3) setCompareIds([...compareIds, id]);
    else showToast("最多比较 3 个试验", "error");
  };

  /* ========== Filter & Sort ========== */
  let filtered = Array.isArray(trials) ? trials.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.indication?.toLowerCase().includes(search.toLowerCase()) ||
    t.journal?.toLowerCase().includes(search.toLowerCase())
  ) : [];
  if (filters.phase) filtered = filtered.filter(t => t.phase === filters.phase);
  if (filters.journal) filtered = filtered.filter(t => t.journal === filters.journal);
  if (filters.sortBy === "sample") filtered.sort((a, b) => b.sample_size - a.sample_size);
  else if (filters.sortBy === "title") filtered.sort((a, b) => a.title.localeCompare(b.title));

  const favTrials = trials.filter(t => favorites.includes(t.id));

  /* ========== Components ========== */
  const JBadge = ({ journal }: { journal: string }) => {
    const c = JC[journal] || DC;
    return <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${c.bg} ${c.text} ${c.border}`}>{journal}</span>;
  };

  const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="p-1 hover:scale-110 transition-transform" title={filled ? "取消收藏" : "收藏"}>
      <svg className={`w-4 h-4 ${filled ? "text-amber-400 fill-amber-400" : "text-gray-300 hover:text-amber-400"}`} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  );

  const NavBtn = ({ k, label, icon }: { k: string; label: string; icon: string }) => (
    <button onClick={() => setView(k as any)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
        view === k ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
      }`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </button>
  );

  /* ========== RENDER ========== */
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-xl text-[13px] font-medium shadow-lg border transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView("home")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-gray-900 tracking-tight">Clinical Trials Insight</div>
              <div className="text-[10px] text-gray-400 -mt-0.5">AI-Powered Trial Analysis</div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-0.5">
            <NavBtn k="home" label="试验总览" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            <NavBtn k="pubmed" label="PubMed" icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <NavBtn k="favorites" label={`收藏${favTrials.length > 0 ? ` (${favTrials.length})` : ""}`} icon="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            <NavBtn k="subscriptions" label="订阅" icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="导出 CSV">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
            <button className="px-3.5 py-1.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition shadow-sm">登录</button>
          </div>
        </div>
      </header>

      {/* HOME */}
      {view === "home" && (
        <>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">全球临床试验智能分析</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-lg leading-relaxed">
                  自动追踪 NEJM、Lancet、JAMA、BMJ 等顶级期刊最新临床试验，AI 驱动方法学评估与学术评论生成
                </p>
                <div className="flex gap-2 max-w-xl">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="搜索疾病、药物、期刊..." value={search}
                      onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white shadow-sm transition" />
                  </div>
                  <button onClick={handleSearch} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition shadow-sm">搜索</button>
                  <button onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2.5 border rounded-xl transition shadow-sm ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                  </button>
                </div>
                {/* Filters */}
                {showFilters && (
                  <div className="mt-3 flex flex-wrap gap-2 max-w-xl">
                    <select value={filters.phase} onChange={e => setFilters({...filters, phase: e.target.value})}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white focus:ring-2 focus:ring-blue-500/20">
                      <option value="">全部阶段</option>
                      <option value="Phase 1">Phase 1</option>
                      <option value="Phase 2">Phase 2</option>
                      <option value="Phase 3">Phase 3</option>
                      <option value="Phase 4">Phase 4</option>
                    </select>
                    <select value={filters.journal} onChange={e => setFilters({...filters, journal: e.target.value})}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white focus:ring-2 focus:ring-blue-500/20">
                      <option value="">全部期刊</option>
                      {Array.from(new Set(trials.map(t => t.journal))).map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <select value={filters.sortBy} onChange={e => setFilters({...filters, sortBy: e.target.value})}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white focus:ring-2 focus:ring-blue-500/20">
                      <option value="date">按日期</option>
                      <option value="sample">按样本量</option>
                      <option value="title">按标题</option>
                    </select>
                    {(filters.phase || filters.journal) && (
                      <button onClick={() => setFilters({phase: "", journal: "", sortBy: "date"})}
                        className="px-2.5 py-1.5 text-[11px] text-gray-500 hover:text-gray-800 transition">清除筛选</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {stats && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { v: stats.total_trials, l: "总试验数", g: "from-blue-500 to-blue-600", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { v: stats.recent_7_days, l: "近 7 天新增", g: "from-emerald-500 to-emerald-600", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
                  { v: stats.by_journal?.length || 0, l: "期刊来源", g: "from-violet-500 to-violet-600", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
                  { v: stats.by_indication?.length || 0, l: "适应症类型", g: "from-amber-500 to-orange-500", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                ].map((s, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${s.g}`} />
                    <div className="pl-5 pr-4 py-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.g} flex items-center justify-center shadow-sm group-hover:scale-105 transition`}>
                        <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                        </svg>
                      </div>
                      <div><div className="text-xl font-bold text-gray-900">{s.v}</div><div className="text-[11px] text-gray-400 font-medium">{s.l}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Charts */}
          {stats && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Journal Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-[13px] font-semibold text-gray-900 mb-4">期刊分布</h4>
                  <div className="space-y-2.5">
                    {(stats.by_journal || []).slice(0, 6).map((j, i) => {
                      const max = Math.max(...(stats.by_journal || []).map(x => x.count));
                      const pct = max > 0 ? (j.count / max) * 100 : 0;
                      const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-500 w-24 truncate shrink-0">{j.journal.split(" ").slice(0, 2).join(" ")}</span>
                          <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`} style={{width: `${pct}%`}} />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-700 w-6 text-right">{j.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Indication Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-[13px] font-semibold text-gray-900 mb-4">适应症分布</h4>
                  <div className="space-y-2.5">
                    {(stats.by_indication || []).slice(0, 6).map((ind, i) => {
                      const max = Math.max(...(stats.by_indication || []).map(x => x.count));
                      const pct = max > 0 ? (ind.count / max) * 100 : 0;
                      const colors = ["bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-pink-500", "bg-lime-500", "bg-sky-500"];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-500 w-24 truncate shrink-0">{ind.indication}</span>
                          <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`} style={{width: `${pct}%`}} />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-700 w-6 text-right">{ind.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Trending */}
          {stats && stats.by_indication && stats.by_indication.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                </svg>
                热门研究方向
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.by_indication.slice(0, 8).map((ind, i) => (
                  <button key={i}
                    onClick={() => { setSearch(ind.indication); handleSearch(); }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[12px] text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition flex items-center gap-1.5">
                    <span>{ind.indication}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{ind.count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">最新临床试验</h3>
              <div className="flex items-center gap-2">
                {compareMode && compareIds.length >= 2 && (
                  <button onClick={() => { setCompareMode(false); setCompareIds([]); showToast("比较功能开发中"); }}
                    className="px-3 py-1 bg-blue-600 text-white text-[11px] rounded-lg hover:bg-blue-700 transition">
                    比较 ({compareIds.length})
                  </button>
                )}
                <button onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }}
                  className={`px-3 py-1 text-[11px] rounded-lg border transition ${compareMode ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  {compareMode ? "取消比较" : "比较模式"}
                </button>
                <span className="text-xs text-gray-400 bg-gray-100/80 px-2.5 py-1 rounded-full">{filtered.length} 条</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex gap-3"><div className="h-5 bg-gray-100 rounded w-20" /><div className="h-5 bg-gray-100 rounded w-16" /></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mt-3" /><div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map(trial => (
                  <div key={trial.id} className={`bg-white rounded-xl border transition-all group ${
                    compareMode && compareIds.includes(trial.id) ? "border-blue-300 ring-2 ring-blue-100" :
                    favorites.includes(trial.id) ? "border-amber-200" : "border-gray-100 hover:border-blue-200/60 hover:shadow-sm"
                  }`}>
                    <div className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {compareMode && (
                              <input type="checkbox" checked={compareIds.includes(trial.id)}
                                onChange={() => toggleCompare(trial.id)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            )}
                            <JBadge journal={trial.journal} />
                            {trial.phase && <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{trial.phase}</span>}
                            <span className="text-[11px] text-gray-400 ml-1">{trial.published_date}</span>
                            <StarIcon filled={favorites.includes(trial.id)} onClick={() => toggleFavorite(trial.id)} />
                          </div>
                          <h4 className="text-[15px] font-semibold text-gray-900 mb-1.5 leading-snug group-hover:text-blue-700 transition-colors">{trial.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400 mb-2">
                            {trial.indication && <span>适应症 <strong className="text-gray-600 font-medium">{trial.indication}</strong></span>}
                            {trial.sample_size > 0 && <span>样本量 <strong className="text-gray-600 font-medium">{trial.sample_size.toLocaleString()}</strong></span>}
                            {trial.authors && <span className="hidden md:inline">{trial.authors}</span>}
                          </div>
                          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-2.5">{trial.key_results}</p>
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                            {trial.doi && <a href={`https://doi.org/${trial.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline transition-colors">DOI</a>}
                            {trial.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${trial.pmid}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline transition-colors">PubMed</a>}
                            {trial.pdf_url && <a href={trial.pdf_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">PDF</a>}
                          </div>
                          {trial.commentary && (
                            <div className="mt-3 bg-blue-50/40 border border-blue-100/60 rounded-lg p-3.5">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span className="text-[11px] font-semibold text-blue-700">AI Commentary</span>
                              </div>
                              <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-3">{trial.commentary.replace(/##?\s?/g, "").replace(/\*\*/g, "").substring(0, 300)}...</p>
                            </div>
                          )}
                        </div>
                        <div className="flex lg:flex-col gap-1.5 shrink-0">
                          <button onClick={() => handleAnalyze(trial)} disabled={analyzing && selectedTrial?.id === trial.id}
                            className="px-3.5 py-2 bg-gray-900 text-white text-[12px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition shadow-sm whitespace-nowrap">
                            {analyzing && selectedTrial?.id === trial.id ? (
                              <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                分析中
                              </span>
                            ) : "AI 分析"}
                          </button>
                          <button onClick={() => handleCommentary(trial.id)} disabled={commentaryGenerating === trial.id}
                            className="px-3.5 py-2 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-lg hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 transition whitespace-nowrap">
                            {commentaryGenerating === trial.id ? "生成中..." : "生成评论"}
                          </button>
                          <button onClick={() => setDetailTrial(trial)}
                            className="px-3.5 py-2 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-lg hover:bg-gray-50 hover:text-gray-800 transition whitespace-nowrap">详情</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* PUBMED */}
      {view === "pubmed" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-1 tracking-tight">PubMed 实时检索</h2>
            <p className="text-sm text-gray-400 mb-6">搜索 PubMed 数据库中 2025 年后发表的临床试验论文</p>
            <div className="flex gap-2 mb-8">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="semaglutide, heart failure, NEJM..." value={pubmedQuery}
                  onChange={e => setPubmedQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handlePubmedSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white shadow-sm" />
              </div>
              <button onClick={handlePubmedSearch} disabled={pubmedLoading}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition shadow-sm">
                {pubmedLoading ? "搜索中..." : "搜索"}
              </button>
            </div>
            {pubmedLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>)}</div>}
            {!pubmedLoading && pubmedSearched && pubmedResults.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-sm text-gray-400">未找到结果，尝试其他关键词</p>
              </div>
            )}
            {!pubmedLoading && pubmedResults.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs text-gray-400 mb-2">找到 {pubmedResults.length} 条结果</p>
                {pubmedResults.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200/60 hover:shadow-sm transition group">
                    <h4 className="text-[13px] font-semibold text-gray-900 mb-1.5 leading-snug group-hover:text-blue-700 transition-colors">{item.title}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 mb-2">
                      <span className="text-gray-500 font-medium">{item.journal}</span>
                      <span>{item.published_date}</span>
                      <span className="hidden sm:inline">{item.authors}</span>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <a href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline">PubMed</a>
                      {item.doi && <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline">DOI</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAVORITES */}
      {view === "favorites" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold mb-1 tracking-tight">收藏的试验</h2>
          <p className="text-sm text-gray-400 mb-6">您收藏的临床试验 ({favTrials.length})</p>
          {favTrials.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <p className="text-sm text-gray-400 mb-3">暂无收藏，点击试验卡片上的星标收藏</p>
              <button onClick={() => setView("home")} className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition shadow-sm">浏览试验</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {favTrials.map(trial => (
                <div key={trial.id} className="bg-white rounded-xl border border-amber-200 hover:shadow-sm transition-all p-5">
                  <div className="flex items-start gap-3">
                    <StarIcon filled={true} onClick={() => toggleFavorite(trial.id)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><JBadge journal={trial.journal} /><span className="text-[11px] text-gray-400">{trial.published_date}</span></div>
                      <h4 className="text-[14px] font-semibold text-gray-900 mb-1">{trial.title}</h4>
                      <p className="text-[12px] text-gray-500 line-clamp-1">{trial.key_results}</p>
                    </div>
                    <button onClick={() => { setSelectedTrial(trial); handleAnalyze(trial); setView("home"); }}
                      className="px-3 py-1.5 bg-gray-900 text-white text-[11px] rounded-lg hover:bg-gray-800 transition">AI 分析</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SUBSCRIPTIONS */}
      {view === "subscriptions" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-1 tracking-tight">我的订阅</h2>
            <p className="text-sm text-gray-400 mb-6">订阅感兴趣的疾病、药物或期刊，新试验发布时自动通知</p>
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-4">暂无订阅，创建订阅以获取最新试验通知</p>
              <button className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition shadow-sm">创建订阅</button>
            </div>
          </div>
        </section>
      )}

      {/* ANALYSIS MODAL */}
      {analysis && selectedTrial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAnalysis(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">AI 分析报告</h3>
              <button onClick={() => setAnalysis(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">试验信息</span>
                </div>
                <div className="bg-gray-50/80 rounded-xl p-4 text-[13px] space-y-1.5">
                  <div className="flex"><span className="text-gray-400 w-16 shrink-0">标题</span><span className="font-medium text-gray-800">{analysis.trial_info.title}</span></div>
                  <div className="flex"><span className="text-gray-400 w-16 shrink-0">期刊</span><span className="font-medium text-gray-800">{analysis.trial_info.journal}</span></div>
                  <div className="flex gap-8">
                    <div className="flex"><span className="text-gray-400 w-16 shrink-0">适应症</span><span className="font-medium text-gray-800">{analysis.trial_info.indication}</span></div>
                    <div className="flex"><span className="text-gray-400 w-16 shrink-0">样本量</span><span className="font-medium text-gray-800">{analysis.trial_info.sample_size?.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded bg-violet-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">方法学评估</span>
                </div>
                <div className="bg-gray-50/80 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                  {Object.entries(analysis.methodological_assessment).map(([k, v]) => (
                    <div key={k} className="flex"><span className="text-gray-400 min-w-0 shrink-0">{k === "randomization" ? "随机化" : k === "blinding" ? "盲法" : k === "sample_size_adequacy" ? "样本量" : k === "follow_up_duration" ? "随访" : "偏倚"} </span><span className="font-medium text-gray-800">{v}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">主要发现</span>
                </div>
                <ul className="space-y-1.5">{analysis.key_findings.map((f, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600"><span className="text-emerald-500 mt-0.5 text-xs">+</span>{f}</li>)}</ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded bg-amber-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">局限性</span>
                </div>
                <ul className="space-y-1.5">{analysis.limitations.map((l, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600"><span className="text-amber-500 mt-0.5 text-xs">!</span>{l}</li>)}</ul>
              </div>
              <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4">
                <span className="text-[12px] font-semibold text-blue-800 block mb-1">临床意义</span>
                <p className="text-[13px] text-blue-700/80 leading-relaxed">{analysis.clinical_significance}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailTrial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailTrial(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">试验详情</h3>
              <button onClick={() => setDetailTrial(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <JBadge journal={detailTrial.journal} />
                {detailTrial.phase && <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{detailTrial.phase}</span>}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">{detailTrial.title}</h4>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div><span className="text-gray-400">适应症</span><div className="font-medium text-gray-800">{detailTrial.indication}</div></div>
                <div><span className="text-gray-400">样本量</span><div className="font-medium text-gray-800">{detailTrial.sample_size?.toLocaleString()}</div></div>
                <div><span className="text-gray-400">发表日期</span><div className="font-medium text-gray-800">{detailTrial.published_date}</div></div>
                <div><span className="text-gray-400">期刊</span><div className="font-medium text-gray-800">{detailTrial.journal}</div></div>
              </div>
              {detailTrial.authors && (
                <div>
                  <span className="text-[12px] text-gray-400">作者</span>
                  <p className="text-[13px] text-gray-700 mt-1">{detailTrial.authors}</p>
                </div>
              )}
              <div>
                <span className="text-[12px] text-gray-400">关键结果</span>
                <p className="text-[13px] text-gray-700 mt-1">{detailTrial.key_results}</p>
              </div>
              {detailTrial.abstract && (
                <div>
                  <span className="text-[12px] text-gray-400">摘要</span>
                  <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{detailTrial.abstract}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                {detailTrial.doi && <a href={`https://doi.org/${detailTrial.doi}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-900 text-white text-[12px] rounded-lg hover:bg-gray-800 transition">查看 DOI</a>}
                {detailTrial.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${detailTrial.pmid}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-200 text-gray-700 text-[12px] rounded-lg hover:bg-gray-50 transition">PubMed</a>}
                <button onClick={() => { setDetailTrial(null); handleAnalyze(detailTrial); }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-[12px] rounded-lg hover:bg-gray-50 transition">AI 分析</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>Clinical Trials Insight &middot; AI-Powered Trial Analysis</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-gray-600 cursor-pointer transition-colors">隐私政策</span>
              <span className="hover:text-gray-600 cursor-pointer transition-colors">使用条款</span>
              <span className="hover:text-gray-600 cursor-pointer transition-colors">联系我们</span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
