#!/usr/bin/env python3
"""
后端API测试
"""

import pytest
import asyncio
from httpx import AsyncClient
from src.main import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_health_check():
    """测试健康检查接口"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

@pytest.mark.anyio
async def test_get_trials():
    """获取试验列表"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/trials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

@pytest.mark.anyio
async def test_import_sample_data():
    """导入示例数据"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/sample-data")
        assert response.status_code == 200
        data = response.json()
        assert "imported" in data
        assert data["imported"] > 0

@pytest.mark.anyio
async def test_get_stats():
    """获取统计信息"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_trials" in data
        assert "by_journal" in data

@pytest.mark.anyio
async def test_analyze_trial():
    """分析试验"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 先导入数据
        await client.post("/api/sample-data")
        
        # 分析试验
        response = await client.post(
            "/api/analyze",
            json={"pmid": "38123456"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "trial_info" in data
        assert "methodological_assessment" in data

@pytest.mark.anyio
async def test_generate_commentary():
    """生成评论"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 先导入数据
        await client.post("/api/sample-data")
        
        # 生成评论
        response = await client.post(
            "/api/commentary/generate",
            json={"trial_id": 1, "style": "academic"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "commentary" in data
        assert len(data["commentary"]) > 0

@pytest.mark.anyio
async def test_unpaywall():
    """测试Unpaywall API"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/unpaywall/test",
            params={"doi": "10.1056/NEJMoa2500101"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "doi" in data
        assert "is_oa" in data

@pytest.mark.anyio
async def test_subscriptions():
    """测试订阅功能"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 创建订阅
        response = await client.post(
            "/api/subscriptions",
            json={
                "user_id": 1,
                "indication": "Diabetes",
                "phase": "Phase 3",
                "notification_method": "email"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        
        # 获取订阅列表
        response = await client.get("/api/subscriptions", params={"user_id": 1})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
