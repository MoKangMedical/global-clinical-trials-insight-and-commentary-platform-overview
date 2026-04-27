"use client";

import { useState, useEffect } from "react";

interface Trial {
  id: number;
  title: string;
  journal: string;
  indication: string;
  phase: string;
  sample_size: number;
  published_date: string;
  key_results: string;
  doi: string;
  pmid: string;
  authors: string;
  abstract: string;
  pdf_url: string;
  commentary: string;
}

interface Stats {
  total_trials: number;
  by_journal: Array<{journal: string; count: number}>;
  by_indication: Array<{indication: string; count: number}>;
  recent_7_days: number;
}

export default function Home() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 导入示例数据
      await fetch(`${API_BASE}/api/sample-data`, { method: "POST" });
      
      // 获取试验列表
      const trialsRes = await fetch(`${API_BASE}/api/trials?limit=20`);
      const trialsData = await trialsRes.json();
      setTrials(trialsData);
      
      // 获取统计信息
      const statsRes = await fetch(`${API_BASE}/api/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadData();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/trials?limit=50&indication=${encodeURIComponent(searchKeyword)}`);
      const data = await res.json();
      setTrials(data);
    } catch (error) {
      console.error("搜索失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (trial: Trial) => {
    setSelectedTrial(trial);
    setAnalyzing(true);
    setAnalysis(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmid: trial.pmid || "00000000" })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error("分析失败:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateCommentary = async (trialId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/commentary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trial_id: trialId, style: "academic" })
      });
      const data = await res.json();
      
      // 更新试验列表
      setTrials(trials.map(t => 
        t.id === trialId ? { ...t, commentary: data.commentary } : t
      ));
      
      if (selectedTrial?.id === trialId) {
        setSelectedTrial({ ...selectedTrial, commentary: data.commentary });
      }
    } catch (error) {
      console.error("生成评论失败:", error);
    }
  };

  const filteredTrials = trials.filter(trial =>
    trial.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (trial.indication && trial.indication.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    trial.journal.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Clinical Trials Insight</h1>
                <p className="text-xs text-gray-500">全球临床试验追踪与评论平台</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <a href="#stats" className="text-sm text-gray-600 hover:text-gray-900">统计</a>
              <a href="#trials" className="text-sm text-gray-600 hover:text-gray-900">试验</a>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                登录
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              智能分析全球顶级期刊临床试验
            </h2>
            <p className="text-lg text-gray-600">
              自动追踪 NEJM、Lancet、JAMA、BMJ 等顶级期刊最新发表的临床试验，
              提供方法学漏洞分析与高质量评论生成
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜索试验、疾病、期刊或关键词..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  onClick={handleSearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜索
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section id="stats" className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.total_trials}</div>
              <div className="text-sm text-gray-500">总试验数</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-green-600">{stats.recent_7_days}</div>
              <div className="text-sm text-gray-500">近7天新增</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-purple-600">{stats.by_journal.length}</div>
              <div className="text-sm text-gray-500">期刊来源</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-orange-600">{stats.by_indication.length}</div>
              <div className="text-sm text-gray-500">适应症类型</div>
            </div>
          </div>
          
          {/* Top Journals */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">热门期刊</h3>
              <div className="space-y-2">
                {stats.by_journal.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.journal}</span>
                    <span className="text-sm font-medium text-blue-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">热门适应症</h3>
              <div className="space-y-2">
                {stats.by_indication.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.indication}</span>
                    <span className="text-sm font-medium text-green-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trials List */}
      <section id="trials" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            2026年最新临床试验
          </h3>
          <span className="text-sm text-gray-500">
            {filteredTrials.length} 个试验
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrials.map((trial) => (
              <div key={trial.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {trial.journal}
                        </span>
                        {trial.phase && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            {trial.phase}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{trial.published_date}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {trial.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {trial.indication && <span>适应症: {trial.indication}</span>}
                        {trial.sample_size > 0 && <span>样本量: {trial.sample_size.toLocaleString()}</span>}
                        {trial.authors && <span>作者: {trial.authors}</span>}
                      </div>
                      <p className="text-gray-700 mb-4">{trial.key_results}</p>
                      
                      {/* Links */}
                      <div className="flex items-center gap-3 mb-4">
                        {trial.doi && (
                          <a
                            href={`https://doi.org/${trial.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            DOI: {trial.doi}
                          </a>
                        )}
                        {trial.pmid && (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${trial.pmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            PMID: {trial.pmid}
                          </a>
                        )}
                        {trial.pdf_url && (
                          <a
                            href={trial.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            PDF下载
                          </a>
                        )}
                      </div>
                      
                      {/* Commentary */}
                      {trial.commentary && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">AI生成评论</h5>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {trial.commentary.substring(0, 500)}...
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleAnalyze(trial)}
                        disabled={analyzing && selectedTrial?.id === trial.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {analyzing && selectedTrial?.id === trial.id ? "分析中..." : "一键分析"}
                      </button>
                      <button
                        onClick={() => handleGenerateCommentary(trial.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                      >
                        生成评论
                      </button>
                      <button
                        onClick={() => setSelectedTrial(trial)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analysis Modal */}
      {analysis && selectedTrial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">试验分析报告</h3>
                <button
                  onClick={() => setAnalysis(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Trial Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">试验信息</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>标题:</strong> {analysis.trial_info.title}</p>
                    <p><strong>期刊:</strong> {analysis.trial_info.journal}</p>
                    <p><strong>适应症:</strong> {analysis.trial_info.indication}</p>
                    <p><strong>样本量:</strong> {analysis.trial_info.sample_size}</p>
                    <p><strong>阶段:</strong> {analysis.trial_info.phase}</p>
                  </div>
                </div>
                
                {/* Methodological Assessment */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">方法学评估</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>随机化:</strong> {analysis.methodological_assessment.randomization}</p>
                    <p><strong>盲法:</strong> {analysis.methodological_assessment.blinding}</p>
                    <p><strong>样本量充分性:</strong> {analysis.methodological_assessment.sample_size_adequacy}</p>
                    <p><strong>随访时间:</strong> {analysis.methodological_assessment.follow_up_duration}</p>
                    <p><strong>偏倚风险:</strong> {analysis.methodological_assessment.risk_of_bias}</p>
                  </div>
                </div>
                
                {/* Key Findings */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">主要发现</h4>
                  <ul className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {analysis.key_findings.map((finding: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Limitations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">局限性</h4>
                  <ul className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {analysis.limitations.map((limitation: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">!</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Clinical Significance */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">临床意义</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700">{analysis.clinical_significance}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>全球临床试验洞察平台 - AI驱动的临床试验分析与评论生成</p>
            <p className="mt-2">© 2026 Clinical Trials Insight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
