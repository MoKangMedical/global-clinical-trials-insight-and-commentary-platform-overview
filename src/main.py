#!/usr/bin/env python3
"""
全球临床试验洞察平台 - 完整后端API
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import sqlite3
import json
import httpx
import os
from datetime import datetime, timedelta
from contextlib import contextmanager

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server.unpaywall_service import unpaywall_service
app = FastAPI(
    title="全球临床试验洞察平台",
    description="AI驱动的全球临床试验数据分析与评论平台",
    version="2.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置
DATABASE_URL = "clinical_trials.db"

# 数据模型
class Trial(BaseModel):
    id: Optional[int] = None
    title: str
    journal: str
    indication: str
    phase: str
    sample_size: int
    published_date: str
    key_results: str
    doi: Optional[str] = None
    pmid: Optional[str] = None
    authors: Optional[str] = None
    abstract: Optional[str] = None
    pdf_url: Optional[str] = None
    commentary: Optional[str] = None
    methodological_flaws: Optional[List[Dict]] = None
    created_at: Optional[str] = None

class Subscription(BaseModel):
    id: Optional[int] = None
    user_id: int
    indication: Optional[str] = None
    phase: Optional[str] = None
    journal: Optional[str] = None
    keywords: Optional[str] = None
    notification_method: str = "email"
    is_active: bool = True

class AnalysisRequest(BaseModel):
    pmid: str
    doi: Optional[str] = None

class CommentaryRequest(BaseModel):
    trial_id: int
    style: str = "academic"  # academic, clinical, editorial

# 数据库初始化
def init_db():
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # 创建试验表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            journal TEXT NOT NULL,
            indication TEXT,
            phase TEXT,
            sample_size INTEGER,
            published_date TEXT,
            key_results TEXT,
            doi TEXT,
            pmid TEXT UNIQUE,
            authors TEXT,
            abstract TEXT,
            pdf_url TEXT,
            commentary TEXT,
            methodological_flaws TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建订阅表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            indication TEXT,
            phase TEXT,
            journal TEXT,
            keywords TEXT,
            notification_method TEXT DEFAULT 'email',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建分析记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trial_id INTEGER,
            analysis_type TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trial_id) REFERENCES trials(id)
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# 初始化数据库
init_db()

# PubMed API服务
PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

async def search_pubmed(query: str, max_results: int = 20, min_date: str = "2025/01/01"):
    """搜索PubMed数据库"""
    async with httpx.AsyncClient() as client:
        # 搜索PMID列表
        search_url = f"{PUBMED_BASE_URL}/esearch.fcgi"
        params = {
            "db": "pubmed",
            "term": f"{query} AND Clinical Trial[pt] AND {min_date}[dp]",
            "retmax": max_results,
            "retmode": "json",
            "sort": "date"
        }
        
        response = await client.get(search_url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="PubMed搜索失败")
        
        data = response.json()
        pmids = data.get("esearchresult", {}).get("idlist", [])
        
        if not pmids:
            return []
        
        # 获取详细信息
        fetch_url = f"{PUBMED_BASE_URL}/esummary.fcgi"
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json"
        }
        
        response = await client.get(fetch_url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="获取论文详情失败")
        
        data = response.json()
        results = []
        
        for pmid in pmids:
            article = data.get("result", {}).get(pmid, {})
            if article:
                # 提取期刊名称
                journal = article.get("fulljournalname", article.get("source", ""))
                
                # 提取发表日期
                pub_date = article.get("pubdate", "")
                
                # 提取作者
                authors_list = article.get("authors", [])
                authors = ", ".join([a.get("name", "") for a in authors_list[:5]])
                if len(authors_list) > 5:
                    authors += " et al."
                
                results.append({
                    "pmid": pmid,
                    "title": article.get("title", ""),
                    "journal": journal,
                    "published_date": pub_date,
                    "authors": authors,
                    "doi": article.get("elocationid", "").replace("doi: ", ""),
                    "abstract": article.get("sortpubdate", "")
                })
        
        return results

async def fetch_article_details(pmid: str):
    """获取文章详细信息"""
    async with httpx.AsyncClient() as client:
        url = f"{PUBMED_BASE_URL}/efetch.fcgi"
        params = {
            "db": "pubmed",
            "id": pmid,
            "rettype": "abstract",
            "retmode": "xml"
        }
        
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return None
        
        # 简化处理，返回基本信息
        result = {
            "pmid": pmid,
            "abstract": response.text[:1000] if response.text else ""
        }
        return result

async def find_open_access_pdf(doi: str):
    """通过Unpaywall服务查找开放获取PDF"""
    if not doi:
        return None
    
    try:
        result = await unpaywall_service.find_open_access_pdf(doi)
        
        if result and result.get("is_oa"):
            return result.get("pdf_url")
        
        return None
    
    except Exception as e:
        print(f"Unpaywall查询失败: {e}")
        return None


# API路由

@app.get("/")
async def root():
    return {
        "message": "欢迎使用全球临床试验洞察平台",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "全球临床试验洞察平台"}

# 试验相关API

@app.get("/api/trials", response_model=List[Dict])
async def get_trials(
    limit: int = Query(50, ge=1, le=100),
    year: Optional[int] = None,
    indication: Optional[str] = None,
    journal: Optional[str] = None
):
    """获取临床试验列表"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = "SELECT * FROM trials WHERE 1=1"
        params = []
        
        if year:
            query += " AND strftime('%Y', published_date) = ?"
            params.append(str(year))
        
        if indication:
            query += " AND indication LIKE ?"
            params.append(f"%{indication}%")
        
        if journal:
            query += " AND journal LIKE ?"
            params.append(f"%{journal}%")
        
        query += " ORDER BY published_date DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]

@app.get("/api/trials/{trial_id}")
async def get_trial(trial_id: int):
    """获取单个试验详情"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trials WHERE id = ?", (trial_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="试验未找到")
        
        trial = dict(row)
        
        # 解析方法学漏洞JSON
        if trial.get("methodological_flaws"):
            trial["methodological_flaws"] = json.loads(trial["methodological_flaws"])
        
        return trial

@app.post("/api/trials/import")
async def import_trial(trial: Trial):
    """导入临床试验数据"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 检查是否已存在
        if trial.pmid:
            cursor.execute("SELECT id FROM trials WHERE pmid = ?", (trial.pmid,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="该试验已存在")
        
        cursor.execute('''
            INSERT INTO trials (title, journal, indication, phase, sample_size, 
                              published_date, key_results, doi, pmid, authors, abstract)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            trial.title, trial.journal, trial.indication, trial.phase,
            trial.sample_size, trial.published_date, trial.key_results,
            trial.doi, trial.pmid, trial.authors, trial.abstract
        ))
        
        conn.commit()
        trial_id = cursor.lastrowid
        
        return {"id": trial_id, "message": "导入成功"}

# PubMed搜索API

@app.get("/api/pubmed/search")
async def search_pubmed_api(
    query: str = Query(..., min_length=2),
    max_results: int = Query(20, ge=1, le=50)
):
    """搜索PubMed数据库"""
    results = await search_pubmed(query, max_results)
    return {"results": results, "count": len(results)}

@app.post("/api/pubmed/import/{pmid}")
async def import_from_pubmed(pmid: str):
    """从PubMed导入论文"""
    # 获取论文详情
    details = await fetch_article_details(pmid)
    
    if not details:
        raise HTTPException(status_code=404, detail="论文未找到")
    
    # 查找开放获取PDF
    pdf_url = None
    if details.get("doi"):
        pdf_url = await find_open_access_pdf(details["doi"])
    
    # 保存到数据库
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO trials (title, journal, pmid, doi, abstract, pdf_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            details.get("title", ""),
            details.get("journal", ""),
            pmid,
            details.get("doi", ""),
            details.get("abstract", ""),
            pdf_url
        ))
        
        conn.commit()
        trial_id = cursor.lastrowid
        
        return {
            "id": trial_id,
            "pmid": pmid,
            "pdf_url": pdf_url,
            "message": "导入成功"
        }

# AI分析API

@app.post("/api/analyze")
async def analyze_trial(request: AnalysisRequest):
    """分析临床试验"""
    # 获取试验信息
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trials WHERE pmid = ?", (request.pmid,))
        row = cursor.fetchone()
        
        if not row:
            # 从PubMed获取
            details = await fetch_article_details(request.pmid)
            if not details:
                raise HTTPException(status_code=404, detail="试验未找到")
            
            trial_data = details
        else:
            trial_data = dict(row)
    
    # 模拟AI分析（实际应调用OpenAI API）
    analysis = {
        "trial_info": {
            "title": trial_data.get("title", ""),
            "journal": trial_data.get("journal", ""),
            "indication": trial_data.get("indication", "未指定"),
            "sample_size": trial_data.get("sample_size", 0),
            "phase": trial_data.get("phase", "未指定")
        },
        "methodological_assessment": {
            "randomization": "双盲随机对照试验",
            "blinding": "评估者盲法",
            "sample_size_adequacy": "充足",
            "follow_up_duration": "18个月",
            "risk_of_bias": "低"
        },
        "key_findings": [
            "主要终点达到统计学显著性",
            "安全性 profile 良好",
            "亚组分析结果一致"
        ],
        "limitations": [
            "单中心研究，推广性有限",
            "随访时间相对较短",
            "未纳入特定人群"
        ],
        "clinical_significance": "该研究为临床实践提供了重要证据，支持在目标人群中使用该干预措施。",
        "suggested_commentary": f"这项发表在{trial_data.get('journal', '顶级期刊')}的临床试验..."
    }
    
    # 保存分析结果
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO analyses (trial_id, analysis_type, content)
            VALUES (?, ?, ?)
        ''', (trial_data.get("id"), "comprehensive", json.dumps(analysis)))
        conn.commit()
    
    return analysis

# 评论生成API

@app.post("/api/commentary/generate")
async def generate_commentary(request: CommentaryRequest):
    """生成评论"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trials WHERE id = ?", (request.trial_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="试验未找到")
        
        trial = dict(row)
    
    # 生成评论（实际应使用LLM）
    commentary = f"""## Commentary on: {trial['title']}

**Journal:** {trial['journal']}
**Published:** {trial['published_date']}

### Summary

This clinical trial investigated {trial.get('indication', 'the intervention')} in a {trial.get('phase', 'Phase 3')} study with {trial.get('sample_size', 'a significant number of')} participants.

### Methodological Assessment

The study employed a rigorous design with appropriate randomization and blinding procedures. The sample size was adequate to detect clinically meaningful differences.

### Key Findings

{trial.get('key_results', 'The study demonstrated significant efficacy of the intervention.')}

### Limitations

1. The study population may not be fully representative of real-world patients.
2. Long-term effects beyond the study period remain to be determined.
3. Cost-effectiveness analysis was not included.

### Clinical Implications

These findings support the use of this intervention in clinical practice, pending further validation in diverse populations.

### Reference

{trial.get('authors', 'Authors')}. {trial['title']}. {trial['journal']}. {trial['published_date']}. DOI: {trial.get('doi', 'N/A')}
"""
    
    # 保存评论
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE trials SET commentary = ? WHERE id = ?
        ''', (commentary, request.trial_id))
        conn.commit()
    
    return {"commentary": commentary, "trial_id": request.trial_id}

# 订阅管理API

@app.get("/api/subscriptions")
async def get_subscriptions(user_id: int = Query(1)):
    """获取用户订阅"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user_id,))
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]

@app.post("/api/subscriptions")
async def create_subscription(subscription: Subscription):
    """创建订阅"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO subscriptions (user_id, indication, phase, journal, keywords, notification_method)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            subscription.user_id,
            subscription.indication,
            subscription.phase,
            subscription.journal,
            subscription.keywords,
            subscription.notification_method
        ))
        
        conn.commit()
        sub_id = cursor.lastrowid
        
        return {"id": sub_id, "message": "订阅创建成功"}

@app.delete("/api/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: int):
    """删除订阅"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM subscriptions WHERE id = ?", (subscription_id,))
        conn.commit()
        
        return {"message": "订阅已删除"}

# 统计API

@app.get("/api/stats")
async def get_stats():
    """获取平台统计"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 总试验数
        cursor.execute("SELECT COUNT(*) FROM trials")
        total_trials = cursor.fetchone()[0]
        
        # 按期刊统计
        cursor.execute('''
            SELECT journal, COUNT(*) as count 
            FROM trials 
            GROUP BY journal 
            ORDER BY count DESC 
            LIMIT 10
        ''')
        by_journal = [{"journal": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # 按适应症统计
        cursor.execute('''
            SELECT indication, COUNT(*) as count 
            FROM trials 
            WHERE indication IS NOT NULL
            GROUP BY indication 
            ORDER BY count DESC 
            LIMIT 10
        ''')
        by_indication = [{"indication": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # 最近7天新增
        cursor.execute('''
            SELECT COUNT(*) FROM trials 
            WHERE created_at >= datetime('now', '-7 days')
        ''')
        recent_count = cursor.fetchone()[0]
        
        return {
            "total_trials": total_trials,
            "by_journal": by_journal,
            "by_indication": by_indication,
            "recent_7_days": recent_count
        }

# 导入示例数据
@app.post("/api/sample-data")
async def import_sample_data():
    """导入示例数据"""
    sample_trials = [
        {
            "title": "Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes",
            "journal": "New England Journal of Medicine",
            "indication": "Type 2 Diabetes",
            "phase": "Phase 3",
            "sample_size": 17000,
            "published_date": "2026-01-15",
            "key_results": "Semaglutide reduced major adverse cardiovascular events by 26% compared to placebo",
            "doi": "10.1056/NEJMoa2500101",
            "pmid": "38123456",
            "authors": "Marso SP, Daniels GJ, et al.",
            "abstract": "BACKGROUND: Cardiovascular disease is the leading cause of death in patients with type 2 diabetes..."
        },
        {
            "title": "Lecanemab in Early Alzheimer's Disease",
            "journal": "The Lancet",
            "indication": "Alzheimer's Disease",
            "phase": "Phase 3",
            "sample_size": 1795,
            "published_date": "2026-01-20",
            "key_results": "Lecanemab slowed cognitive decline by 27% over 18 months compared to placebo",
            "doi": "10.1016/S0140-6736(26)00101-5",
            "pmid": "38123457",
            "authors": "van Dyck CH, Swanson CJ, et al.",
            "abstract": "BACKGROUND: Alzheimer's disease is a progressive neurodegenerative disorder..."
        },
        {
            "title": "Tirzepatide for Weight Management in Adults with Obesity",
            "journal": "JAMA",
            "indication": "Obesity",
            "phase": "Phase 3",
            "sample_size": 2539,
            "published_date": "2026-01-25",
            "key_results": "Tirzepatide achieved 22.5% weight loss at 72 weeks compared to 2.4% with placebo",
            "doi": "10.1001/jama.2026.0102",
            "pmid": "38123458",
            "authors": "Jastreboff AM, Aronne LJ, et al.",
            "abstract": "BACKGROUND: Obesity is a chronic disease associated with numerous complications..."
        },
        {
            "title": "Nivolumab plus Ipilimumab in Advanced Non-Small-Cell Lung Cancer",
            "journal": "BMJ",
            "indication": "Non-Small-Cell Lung Cancer",
            "phase": "Phase 3",
            "sample_size": 1189,
            "published_date": "2026-02-01",
            "key_results": "Combination immunotherapy improved overall survival by 4.2 months compared to chemotherapy",
            "doi": "10.1136/bmj-2025-012345",
            "pmid": "38123459",
            "authors": "Hellmann MD, Paz-Ares L, et al.",
            "abstract": "BACKGROUND: Non-small-cell lung cancer is the leading cause of cancer death worldwide..."
        },
        {
            "title": "Dapagliflozin in Heart Failure with Preserved Ejection Fraction",
            "journal": "Annals of Internal Medicine",
            "indication": "Heart Failure",
            "phase": "Phase 3",
            "sample_size": 6263,
            "published_date": "2026-02-05",
            "key_results": "Dapagliflozin reduced cardiovascular death and heart failure hospitalization by 18%",
            "doi": "10.7326/M25-1234",
            "pmid": "38123460",
            "authors": "McMurray JJV, Solomon SD, et al.",
            "abstract": "BACKGROUND: Heart failure with preserved ejection fraction is a common condition..."
        }
    ]
    
    imported = 0
    with get_db() as conn:
        cursor = conn.cursor()
        
        for trial in sample_trials:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO trials 
                    (title, journal, indication, phase, sample_size, published_date, 
                     key_results, doi, pmid, authors, abstract)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    trial["title"], trial["journal"], trial["indication"],
                    trial["phase"], trial["sample_size"], trial["published_date"],
                    trial["key_results"], trial["doi"], trial["pmid"],
                    trial["authors"], trial["abstract"]
                ))
                imported += 1
            except Exception as e:
                print(f"导入失败: {e}")
        
        conn.commit()
        
        return {"message": f"成功导入 {imported} 个试验", "imported": imported}

# Unpaywall测试API
@app.get("/api/unpaywall/test")
async def test_unpaywall(doi: str = Query(..., description="论文DOI")):
    """测试Unpaywall API查找开放获取PDF"""
    result = await unpaywall_service.find_open_access_pdf(doi)
    
    if result:
        return {
            "doi": doi,
            "is_oa": result.get("is_oa"),
            "pdf_url": result.get("pdf_url"),
            "message": result.get("message")
        }
    else:
        return {
            "doi": doi,
            "is_oa": False,
            "pdf_url": None,
            "message": "查询失败"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
