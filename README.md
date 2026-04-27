# 全球临床试验洞察平台 (Clinical Trials Insight)

AI驱动的全球临床试验数据分析与评论平台

## 核心功能

### 1. 临床试验数据管理
- 自动导入临床试验数据
- 支持按期刊、适应症、阶段筛选
- 完整的试验信息展示

### 2. PubMed集成
- 实时搜索PubMed数据库
- 自动获取论文详细信息
- 支持DOI和PMID链接

### 3. AI分析功能
- 一键分析临床试验
- 方法学漏洞识别
- 临床意义评估
- 自动生成分析报告

### 4. 评论生成
- AI生成学术评论
- 支持多种风格（学术、临床、编辑）
- 符合期刊投稿要求

### 5. 订阅管理
- 按适应症、期刊、关键词订阅
- 新试验自动通知
- 个性化推荐

## 技术架构

### 后端 (Python FastAPI)
- **框架**: FastAPI
- **数据库**: SQLite
- **API**: RESTful API
- **端口**: 8000

### 前端 (Next.js)
- **框架**: Next.js 14
- **样式**: Tailwind CSS
- **端口**: 3000

## 快速开始

### 1. 启动后端

```bash
cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
source venv/bin/activate
python src/main.py
```

后端将在 http://localhost:8000 启动

### 2. 启动前端

```bash
cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
npm run dev
```

前端将在 http://localhost:3000 启动

### 3. 导入示例数据

```bash
curl -X POST http://localhost:8000/api/sample-data
```

## API文档

启动后端后，访问 http://localhost:8000/docs 查看完整API文档

### 主要API端点

#### 试验管理
- `GET /api/trials` - 获取试验列表
- `GET /api/trials/{id}` - 获取单个试验
- `POST /api/trials/import` - 导入试验

#### PubMed搜索
- `GET /api/pubmed/search?query=关键词` - 搜索PubMed
- `POST /api/pubmed/import/{pmid}` - 从PubMed导入

#### AI分析
- `POST /api/analyze` - 分析试验
- `POST /api/commentary/generate` - 生成评论

#### 订阅管理
- `GET /api/subscriptions` - 获取订阅
- `POST /api/subscriptions` - 创建订阅
- `DELETE /api/subscriptions/{id}` - 删除订阅

#### 统计
- `GET /api/stats` - 获取平台统计

## 数据库结构

### trials表
- id: 主键
- title: 试验标题
- journal: 期刊名称
- indication: 适应症
- phase: 试验阶段
- sample_size: 样本量
- published_date: 发表日期
- key_results: 关键结果
- doi: DOI
- pmid: PubMed ID
- authors: 作者
- abstract: 摘要
- pdf_url: PDF链接
- commentary: AI评论
- methodological_flaws: 方法学漏洞
- created_at: 创建时间

### subscriptions表
- id: 主键
- user_id: 用户ID
- indication: 订阅适应症
- phase: 订阅阶段
- journal: 订阅期刊
- keywords: 订阅关键词
- notification_method: 通知方式
- is_active: 是否激活

### analyses表
- id: 主键
- trial_id: 试验ID
- analysis_type: 分析类型
- content: 分析内容
- created_at: 创建时间

## 部署

### 本地开发
```bash
# 后端
python src/main.py

# 前端
npm run dev
```

### 生产部署
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## 下一步计划

1. **集成Unpaywall API** - 解决PDF下载403问题
2. **添加邮件通知** - SendGrid集成
3. **PDF图表提取** - 自动提取论文图表
4. **批量分析** - 支持同时分析多篇论文
5. **引用格式导出** - 支持Vancouver、AMA、APA格式
6. **用户系统** - 完整的用户认证和权限管理
7. **数据可视化** - 趋势图表和统计分析

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。
