#!/usr/bin/env python3
"""
Unpaywall API服务 - 查找开放获取PDF
"""

import httpx
from typing import Optional, Dict
import asyncio

class UnpaywallService:
    """Unpaywall API服务类"""
    
    BASE_URL = "https://api.unpaywall.org/v2"
    
    def __init__(self, email: str = "research@clinicaltrials.com"):
        """
        初始化Unpaywall服务
        
        Args:
            email: Unpaywall要求的邮箱地址（免费注册）
        """
        self.email = email
    
    async def find_open_access_pdf(self, doi: str) -> Optional[Dict]:
        """
        查找论文的开放获取PDF
        
        Args:
            doi: 论文的DOI
            
        Returns:
            包含PDF URL的字典，或None
        """
        if not doi:
            return None
        
        # 清理DOI
        doi = doi.strip()
        if doi.startswith("doi:"):
            doi = doi[4:].strip()
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.BASE_URL}/{doi}"
                params = {"email": self.email}
                
                response = await client.get(
                    url, 
                    params=params, 
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 检查是否有开放获取版本
                    is_oa = data.get("is_oa", False)
                    
                    if is_oa:
                        # 获取最佳OA位置
                        best_oa = data.get("best_oa_location")
                        
                        if best_oa:
                            return {
                                "is_oa": True,
                                "pdf_url": best_oa.get("url_for_pdf"),
                                "landing_page": best_oa.get("url_for_landing_page"),
                                "version": best_oa.get("version"),
                                "license": best_oa.get("license"),
                                "host_type": best_oa.get("host_type")
                            }
                        
                        # 检查所有OA位置
                        oa_locations = data.get("oa_locations", [])
                        for loc in oa_locations:
                            if loc.get("url_for_pdf"):
                                return {
                                    "is_oa": True,
                                    "pdf_url": loc.get("url_for_pdf"),
                                    "landing_page": loc.get("url_for_landing_page"),
                                    "version": loc.get("version"),
                                    "license": loc.get("license"),
                                    "host_type": loc.get("host_type")
                                }
                    
                    return {
                        "is_oa": False,
                        "pdf_url": None,
                        "message": "该论文没有开放获取版本"
                    }
                
                elif response.status_code == 404:
                    return {
                        "is_oa": False,
                        "pdf_url": None,
                        "message": "DOI未找到"
                    }
                
                else:
                    return {
                        "is_oa": False,
                        "pdf_url": None,
                        "message": f"API请求失败: {response.status_code}"
                    }
            
            except httpx.TimeoutException:
                return {
                    "is_oa": False,
                    "pdf_url": None,
                    "message": "请求超时"
                }
            except Exception as e:
                return {
                    "is_oa": False,
                    "pdf_url": None,
                    "message": f"请求失败: {str(e)}"
                }
    
    async def batch_find_pdf(self, dois: list) -> Dict[str, Optional[str]]:
        """
        批量查找PDF
        
        Args:
            dois: DOI列表
            
        Returns:
            DOI到PDF URL的映射
        """
        results = {}
        
        # 并发请求（限制并发数）
        semaphore = asyncio.Semaphore(5)
        
        async def fetch_one(doi: str):
            async with semaphore:
                result = await self.find_open_access_pdf(doi)
                results[doi] = result.get("pdf_url") if result else None
        
        tasks = [fetch_one(doi) for doi in dois if doi]
        await asyncio.gather(*tasks)
        
        return results

# 创建全局实例
unpaywall_service = UnpaywallService()

# 测试函数
async def test_unpaywall():
    """测试Unpaywall API"""
    # 测试DOI
    test_dois = [
        "10.1056/NEJMoa2500101",  # NEJM
        "10.1016/S0140-6736(26)00101-5",  # Lancet
        "10.1001/jama.2026.0102",  # JAMA
    ]
    
    print("测试Unpaywall API...")
    
    for doi in test_dois:
        print(f"\n查找DOI: {doi}")
        result = await unpaywall_service.find_open_access_pdf(doi)
        
        if result:
            print(f"  开放获取: {result.get('is_oa')}")
            print(f"  PDF URL: {result.get('pdf_url', '无')}")
            print(f"  消息: {result.get('message', '无')}")
        else:
            print("  请求失败")

if __name__ == "__main__":
    asyncio.run(test_unpaywall())
