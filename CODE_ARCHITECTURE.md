# Clinical Trials Platform - 代码架构与API文档

**版本：** v5.0

**作者：** Manus AI

---

## 系统架构概览

本平台采用现代化的全栈TypeScript架构，前后端类型安全，支持实时数据同步和智能分析。

### 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | React | 19.2.1 | 使用Hooks和函数组件 |
| **路由** | Wouter | 3.3.5 | 轻量级路由库 |
| **UI组件** | shadcn/ui + Radix UI | Latest | 无障碍组件库 |
| **样式** | Tailwind CSS | 4.1.14 | 原子化CSS框架 |
| **状态管理** | TanStack Query | 5.90.2 | 服务端状态管理 |
| **RPC框架** | tRPC | 11.6.0 | 端到端类型安全 |
| **后端框架** | Express | 4.21.2 | Node.js Web框架 |
| **ORM** | Drizzle | 0.44.5 | TypeScript-first ORM |
| **数据库** | MySQL | 8.0+ | 关系型数据库 |
| **文件存储** | AWS S3 | - | 对象存储服务 |
| **LLM集成** | Manus Forge API | - | 统一LLM调用接口 |
| **PDF处理** | pdf-parse | Latest | PDF文本提取 |
| **HTTP客户端** | Axios | 1.12.0 | Promise-based HTTP |

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 19 + Wouter + Tailwind CSS                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Home     │  │  PubMed    │  │   Detail   │     │  │
│  │  │   Page     │  │  Search    │  │    Page    │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │         │                │                │           │  │
│  │         └────────────────┴────────────────┘           │  │
│  │                      │                                 │  │
│  │              ┌───────▼────────┐                       │  │
│  │              │  tRPC Client   │                       │  │
│  │              └───────┬────────┘                       │  │
│  └──────────────────────┼──────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTP/JSON
                          │
┌─────────────────────────▼────────────────────────────────┐
│                    Express Server                         │
│  ┌──────────────────────────────────────────────────────┐│
│  │              tRPC Router                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││
│  │  │ Trials   │  │ PubMed   │  │ Comments │           ││
│  │  │ Router   │  │ Router   │  │ Router   │           ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           ││
│  └───────┼─────────────┼─────────────┼──────────────────┘│
│          │             │             │                    │
│  ┌───────▼─────────────▼─────────────▼──────────────────┐│
│  │              Service Layer                            ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││
│  │  │   NLP    │  │  PubMed  │  │   PDF    │           ││
│  │  │ Service  │  │ Service  │  │ Service  │           ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           ││
│  └───────┼─────────────┼─────────────┼──────────────────┘│
│          │             │             │                    │
│  ┌───────▼─────────────▼─────────────▼──────────────────┐│
│  │              Data Access Layer                        ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           ││
│  │  │ Drizzle  │  │  Axios   │  │    S3    │           ││
│  │  │   ORM    │  │  HTTP    │  │  Client  │           ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           ││
│  └───────┼─────────────┼─────────────┼──────────────────┘│
└──────────┼─────────────┼─────────────┼────────────────────┘
           │             │             │
┌──────────▼─────┐ ┌─────▼──────┐ ┌───▼────────┐
│     MySQL      │ │  PubMed    │ │    S3      │
│    Database    │ │    API     │ │  Storage   │
└────────────────┘ └────────────┘ └────────────┘
           │
    ┌──────▼──────┐
    │  LLM API    │
    │  (Manus)    │
    └─────────────┘
```

---

## 数据库Schema设计

### ER图

```
┌─────────────┐         ┌──────────────────┐
│    users    │         │     trials       │
├─────────────┤         ├──────────────────┤
│ id (PK)     │         │ id (PK)          │
│ openId      │         │ pmid             │
│ name        │         │ doi              │
│ email       │         │ title            │
│ role        │         │ authors          │
└─────┬───────┘         │ journal          │
      │                 │ publishedDate    │
      │                 │ trialPhase       │
      │                 │ indication       │
      │                 │ ...              │
      │                 └────┬─────────────┘
      │                      │
      │                      │ 1:N
      │                      │
      │         ┌────────────▼──────────────┐
      │         │ methodological_flaws      │
      │         ├───────────────────────────┤
      │         │ id (PK)                   │
      │         │ trialId (FK)              │
      │         │ flawType                  │
      │         │ severity                  │
      │         │ description               │
      │         └───────────────────────────┘
      │
      │ 1:N                 1:N
      │                      │
┌─────▼───────────┐   ┌─────▼─────────────┐
│ subscriptions   │   │ generated_comments│
├─────────────────┤   ├───────────────────┤
│ id (PK)         │   │ id (PK)           │
│ userId (FK)     │   │ trialId (FK)      │
│ disease         │   │ content           │
│ trialPhase      │   │ wordCount         │
│ journal         │   │ createdAt         │
│ ...             │   └───────────────────┘
└─────────────────┘
      │
      │ 1:N
      │
┌─────▼──────────────┐
│ notification_history│
├────────────────────┤
│ id (PK)            │
│ subscriptionId (FK)│
│ trialId (FK)       │
│ sentAt             │
└────────────────────┘

┌─────────────────┐   ┌──────────────────┐
│  user_notes     │   │exported_documents│
├─────────────────┤   ├──────────────────┤
│ id (PK)         │   │ id (PK)          │
│ userId (FK)     │   │ commentId (FK)   │
│ trialId (FK)    │   │ format           │
│ content         │   │ fileUrl          │
│ createdAt       │   │ createdAt        │
└─────────────────┘   └──────────────────┘
```

### 表结构详解

#### 1. users（用户表）

存储用户基本信息和OAuth认证数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 用户ID |
| `openId` | VARCHAR(64) UNIQUE | Manus OAuth标识符 |
| `name` | TEXT | 用户姓名 |
| `email` | VARCHAR(320) | 邮箱地址 |
| `loginMethod` | VARCHAR(64) | 登录方式 |
| `role` | ENUM('user', 'researcher', 'editor', 'admin') | 用户角色 |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |
| `lastSignedIn` | TIMESTAMP | 最后登录时间 |

**索引：**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`openId`)

#### 2. trials（临床试验表）

存储临床试验的核心信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 试验ID |
| `pmid` | VARCHAR(20) | PubMed ID |
| `doi` | VARCHAR(255) | DOI标识符 |
| `title` | TEXT | 论文标题 |
| `authors` | TEXT | 作者列表 |
| `journal` | VARCHAR(255) | 发表期刊 |
| `publishedDate` | TIMESTAMP | 发表日期 |
| `trialPhase` | ENUM('Phase I', 'Phase II', 'Phase III', 'Phase IV') | 试验阶段 |
| `indication` | TEXT | 适应症 |
| `sampleSize` | INT | 样本量 |
| `randomization` | TEXT | 随机化方法 |
| `blinding` | TEXT | 盲法设计 |
| `primaryEndpoint` | TEXT | 主要终点 |
| `secondaryEndpoint` | TEXT | 次要终点 |
| `keyResults` | TEXT | 关键结果 |
| `statisticalMetrics` | TEXT (JSON) | 统计指标 |
| `conclusion` | TEXT | 结论 |
| `abstractText` | TEXT | 摘要文本 |
| `fullTextUrl` | VARCHAR(512) | 全文链接 |
| `pdfUrl` | VARCHAR(512) | PDF文件URL（S3） |
| `fullTextContent` | LONGTEXT | 全文内容 |
| `figureUrl` | VARCHAR(512) | 关键图表URL |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (`id`)
- INDEX (`pmid`)
- INDEX (`publishedDate`)
- INDEX (`journal`)

#### 3. methodological_flaws（方法学漏洞表）

存储识别出的方法学问题。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 漏洞ID |
| `trialId` | INT (FK) | 关联试验ID |
| `flawType` | VARCHAR(255) | 漏洞类型 |
| `severity` | ENUM('critical', 'major', 'minor') | 严重程度 |
| `description` | TEXT | 详细描述 |
| `recommendation` | TEXT | 改进建议 |
| `createdAt` | TIMESTAMP | 创建时间 |

**外键：**
- FOREIGN KEY (`trialId`) REFERENCES `trials`(`id`)

**常见漏洞类型：**
- `allocation_concealment` - 分配隐藏不足
- `blinding_inadequate` - 盲法设计缺陷
- `missing_data` - 缺失数据处理不当
- `power_insufficient` - 统计功效不足
- `multiple_testing` - 多重比较未校正
- `selective_reporting` - 选择性报告
- `surrogate_endpoint` - 替代终点使用不当

#### 4. generated_comments（生成的评论表）

存储自动生成的Commentary。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 评论ID |
| `trialId` | INT (FK) | 关联试验ID |
| `content` | TEXT | 评论内容（Markdown） |
| `wordCount` | INT | 字数统计 |
| `language` | VARCHAR(10) | 语言（en/zh） |
| `version` | INT | 版本号 |
| `status` | ENUM('draft', 'reviewed', 'published') | 状态 |
| `createdBy` | INT (FK) | 创建用户ID |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |

#### 5. subscriptions（订阅表）

存储用户的订阅偏好。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 订阅ID |
| `userId` | INT (FK) | 用户ID |
| `disease` | VARCHAR(255) | 关注疾病 |
| `trialPhase` | VARCHAR(50) | 试验阶段 |
| `journal` | VARCHAR(255) | 期刊名称 |
| `keywords` | TEXT (JSON) | 关键词列表 |
| `minSampleSize` | INT | 最小样本量 |
| `notificationMethod` | ENUM('email', 'app', 'both') | 通知方式 |
| `frequency` | ENUM('realtime', 'daily', 'weekly') | 通知频率 |
| `active` | BOOLEAN | 是否启用 |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |

#### 6. notification_history（通知历史表）

记录已发送的通知。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 通知ID |
| `subscriptionId` | INT (FK) | 订阅ID |
| `trialId` | INT (FK) | 试验ID |
| `userId` | INT (FK) | 用户ID |
| `method` | ENUM('email', 'app') | 通知方式 |
| `status` | ENUM('sent', 'failed', 'pending') | 发送状态 |
| `sentAt` | TIMESTAMP | 发送时间 |
| `createdAt` | TIMESTAMP | 创建时间 |

#### 7. user_notes（用户笔记表）

存储用户对试验的个人笔记。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 笔记ID |
| `userId` | INT (FK) | 用户ID |
| `trialId` | INT (FK) | 试验ID |
| `content` | TEXT | 笔记内容 |
| `tags` | TEXT (JSON) | 标签列表 |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |

#### 8. exported_documents（导出文档表）

记录导出的文档文件。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT (PK, AUTO_INCREMENT) | 文档ID |
| `commentId` | INT (FK) | 评论ID |
| `userId` | INT (FK) | 用户ID |
| `format` | ENUM('markdown', 'pdf', 'word') | 文件格式 |
| `fileUrl` | VARCHAR(512) | 文件URL（S3） |
| `fileSize` | INT | 文件大小（字节） |
| `createdAt` | TIMESTAMP | 创建时间 |

---

## tRPC API文档

### 认证相关 (auth)

#### `auth.me`

获取当前登录用户信息。

**类型：** Query

**权限：** Public

**输入：** 无

**输出：**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: 'user' | 'researcher' | 'editor' | 'admin';
  createdAt: Date;
  lastSignedIn: Date;
} | null
```

**示例：**
```typescript
const { data: user } = trpc.auth.me.useQuery();
if (user) {
  console.log(`Welcome, ${user.name}!`);
}
```

#### `auth.logout`

退出登录。

**类型：** Mutation

**权限：** Public

**输入：** 无

**输出：**
```typescript
{ success: true }
```

**示例：**
```typescript
const logout = trpc.auth.logout.useMutation();
await logout.mutateAsync();
```

---

### 临床试验相关 (trials)

#### `trials.getRecent`

获取最近发表的临床试验列表。

**类型：** Query

**权限：** Public

**输入：**
```typescript
{
  year?: number;  // 筛选年份（可选）
  limit?: number; // 返回数量限制（默认20）
}
```

**输出：**
```typescript
Array<{
  id: number;
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  publishedDate: Date | null;
  trialPhase: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV' | null;
  indication: string | null;
  sampleSize: number | null;
  keyResults: string | null;
  conclusion: string | null;
  figureUrl: string | null;
  createdAt: Date;
}>
```

**示例：**
```typescript
// 获取2026年的试验
const { data } = trpc.trials.getRecent.useQuery({ year: 2026 });

// 获取最近20个试验
const { data } = trpc.trials.getRecent.useQuery({});
```

#### `trials.getById`

根据ID获取试验详情（包含方法学漏洞）。

**类型：** Query

**权限：** Public

**输入：**
```typescript
{ id: number }
```

**输出：**
```typescript
{
  trial: {
    id: number;
    pmid: string | null;
    doi: string | null;
    title: string;
    authors: string | null;
    journal: string | null;
    publishedDate: Date | null;
    trialPhase: string | null;
    indication: string | null;
    sampleSize: number | null;
    randomization: string | null;
    blinding: string | null;
    primaryEndpoint: string | null;
    secondaryEndpoint: string | null;
    keyResults: string | null;
    statisticalMetrics: string | null;
    conclusion: string | null;
    abstractText: string | null;
    fullTextUrl: string | null;
    pdfUrl: string | null;
    fullTextContent: string | null;
    figureUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  flaws: Array<{
    id: number;
    flawType: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    recommendation: string | null;
  }>;
}
```

**示例：**
```typescript
const { data } = trpc.trials.getById.useQuery({ id: 123 });
console.log(data.trial.title);
console.log(data.flaws.length, "methodological flaws found");
```

#### `trials.search`

搜索临床试验。

**类型：** Query

**权限：** Public

**输入：**
```typescript
{
  keyword?: string;      // 关键词搜索（标题、摘要）
  journal?: string;      // 期刊筛选
  trialPhase?: string;   // 试验阶段筛选
  indication?: string;   // 适应症筛选
  minSampleSize?: number; // 最小样本量
  startDate?: string;    // 开始日期（YYYY-MM-DD）
  endDate?: string;      // 结束日期（YYYY-MM-DD）
}
```

**输出：**
```typescript
Array<Trial>  // 同getRecent返回格式
```

**示例：**
```typescript
// 搜索NEJM发表的心血管疾病试验
const { data } = trpc.trials.search.useQuery({
  journal: "NEJM",
  indication: "cardiovascular",
  minSampleSize: 1000
});
```

#### `trials.importManually`

手动导入单个试验（管理员功能）。

**类型：** Mutation

**权限：** Protected (Admin only)

**输入：**
```typescript
{
  pmid: string;
  doi?: string;
  title: string;
  authors?: string;
  journal?: string;
  publishedDate?: string;
  trialPhase?: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';
  indication?: string;
  sampleSize?: number;
  abstractText?: string;
  fullTextUrl?: string;
}
```

**输出：**
```typescript
{
  success: true;
  trialId: number;
}
```

**示例：**
```typescript
const importTrial = trpc.trials.importManually.useMutation();
const result = await importTrial.mutateAsync({
  pmid: "12345678",
  title: "Novel Treatment for Hypertension",
  journal: "NEJM",
  publishedDate: "2026-01-15",
  trialPhase: "Phase III"
});
console.log("Imported trial ID:", result.trialId);
```

---

### PubMed集成 (pubmed)

#### `pubmed.search`

搜索PubMed数据库。

**类型：** Query

**权限：** Public

**输入：**
```typescript
{
  query: string;        // 搜索关键词
  journal?: string;     // 期刊筛选
  maxResults?: number;  // 最大结果数（默认20）
}
```

**输出：**
```typescript
Array<{
  pmid: string;
  doi: string | null;
  title: string;
  authors: string;
  journal: string;
  publishedDate: string;
  abstract: string;
  pmcId: string | null;
  fullTextUrl: string | null;
}>
```

**示例：**
```typescript
const { data } = trpc.pubmed.search.useQuery({
  query: "semaglutide cardiovascular",
  journal: "NEJM",
  maxResults: 10
});
```

#### `pubmed.importAndAnalyze`

一键导入并分析PubMed论文。

**类型：** Mutation

**权限：** Public

**输入：**
```typescript
{
  pmid: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  publishedDate: string;
  abstract: string;
  pmcId?: string;
  fullTextUrl?: string;
}
```

**输出：**
```typescript
{
  success: true;
  trialId: number;
  pdfDownloaded: boolean;
  flawsCount: number;
  commentaryGenerated: boolean;
}
```

**工作流程：**
1. 尝试下载PDF全文（PMC优先，回退到DOI）
2. 上传PDF到S3存储
3. 提取PDF文本内容
4. 使用LLM分析全文（或摘要）
5. 识别方法学漏洞
6. 生成500词Commentary
7. 保存到数据库

**示例：**
```typescript
const importMutation = trpc.pubmed.importAndAnalyze.useMutation();
const result = await importMutation.mutateAsync({
  pmid: "12345678",
  title: "...",
  authors: "...",
  journal: "NEJM",
  publishedDate: "2026-01-15",
  abstract: "...",
  pmcId: "PMC1234567"
});

if (result.pdfDownloaded) {
  console.log("PDF successfully downloaded and analyzed");
}
```

---

### 评论相关 (comments)

#### `comments.getByTrialId`

获取指定试验的所有评论。

**类型：** Query

**权限：** Public

**输入：**
```typescript
{ trialId: number }
```

**输出：**
```typescript
Array<{
  id: number;
  content: string;
  wordCount: number;
  language: string;
  version: number;
  status: 'draft' | 'reviewed' | 'published';
  createdAt: Date;
  updatedAt: Date;
}>
```

**示例：**
```typescript
const { data: comments } = trpc.comments.getByTrialId.useQuery({ trialId: 123 });
const latestComment = comments?.[0];
```

#### `comments.generate`

为指定试验生成新的Commentary。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  trialId: number;
  language?: 'en' | 'zh';  // 默认'en'
}
```

**输出：**
```typescript
{
  id: number;
  content: string;
  wordCount: number;
}
```

**示例：**
```typescript
const generateComment = trpc.comments.generate.useMutation();
const comment = await generateComment.mutateAsync({
  trialId: 123,
  language: 'en'
});
console.log(`Generated ${comment.wordCount} words`);
```

#### `comments.update`

更新评论内容。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  id: number;
  content: string;
}
```

**输出：**
```typescript
{ success: true }
```

**示例：**
```typescript
const updateComment = trpc.comments.update.useMutation();
await updateComment.mutateAsync({
  id: 456,
  content: "Updated commentary text..."
});
```

#### `comments.export`

导出评论为文件。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  commentId: number;
  format: 'markdown' | 'pdf' | 'word';
}
```

**输出：**
```typescript
{
  fileUrl: string;  // S3 URL
  fileSize: number;
}
```

**示例：**
```typescript
const exportComment = trpc.comments.export.useMutation();
const result = await exportComment.mutateAsync({
  commentId: 456,
  format: 'markdown'
});
window.open(result.fileUrl, '_blank');
```

---

### 订阅相关 (subscriptions)

#### `subscriptions.list`

获取当前用户的所有订阅。

**类型：** Query

**权限：** Protected

**输入：** 无

**输出：**
```typescript
Array<{
  id: number;
  disease: string | null;
  trialPhase: string | null;
  journal: string | null;
  keywords: string | null;
  minSampleSize: number | null;
  notificationMethod: 'email' | 'app' | 'both';
  frequency: 'realtime' | 'daily' | 'weekly';
  active: boolean;
  createdAt: Date;
}>
```

**示例：**
```typescript
const { data: subscriptions } = trpc.subscriptions.list.useQuery();
```

#### `subscriptions.create`

创建新订阅。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  disease?: string;
  trialPhase?: string;
  journal?: string;
  keywords?: string[];
  minSampleSize?: number;
  notificationMethod: 'email' | 'app' | 'both';
  frequency: 'realtime' | 'daily' | 'weekly';
}
```

**输出：**
```typescript
{
  id: number;
  success: true;
}
```

**示例：**
```typescript
const createSub = trpc.subscriptions.create.useMutation();
await createSub.mutateAsync({
  disease: "Alzheimer's Disease",
  trialPhase: "Phase III",
  journal: "NEJM",
  notificationMethod: "email",
  frequency: "daily"
});
```

#### `subscriptions.update`

更新订阅设置。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  id: number;
  disease?: string;
  trialPhase?: string;
  journal?: string;
  keywords?: string[];
  minSampleSize?: number;
  notificationMethod?: 'email' | 'app' | 'both';
  frequency?: 'realtime' | 'daily' | 'weekly';
  active?: boolean;
}
```

**输出：**
```typescript
{ success: true }
```

#### `subscriptions.delete`

删除订阅。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{ id: number }
```

**输出：**
```typescript
{ success: true }
```

---

### 用户笔记 (notes)

#### `notes.list`

获取当前用户的所有笔记。

**类型：** Query

**权限：** Protected

**输入：**
```typescript
{ trialId?: number }  // 可选：筛选特定试验的笔记
```

**输出：**
```typescript
Array<{
  id: number;
  trialId: number;
  content: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### `notes.create`

创建新笔记。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  trialId: number;
  content: string;
  tags?: string[];
}
```

**输出：**
```typescript
{
  id: number;
  success: true;
}
```

#### `notes.update`

更新笔记。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{
  id: number;
  content: string;
  tags?: string[];
}
```

**输出：**
```typescript
{ success: true }
```

#### `notes.delete`

删除笔记。

**类型：** Mutation

**权限：** Protected

**输入：**
```typescript
{ id: number }
```

**输出：**
```typescript
{ success: true }
```

---

## 服务层架构

### NLP分析服务 (nlpService.ts)

负责使用LLM进行深度文本分析。

#### 核心函数

**`extractTrialInformation(text: string)`**

从论文全文或摘要中提取结构化试验信息。

**输入：** 论文全文或摘要文本

**输出：**
```typescript
{
  indication: string;
  sampleSize: number;
  randomization: string;
  blinding: string;
  primaryEndpoint: string;
  secondaryEndpoint: string;
  keyResults: string;
  statisticalMetrics: string;  // JSON格式
  conclusion: string;
}
```

**实现细节：**
- 使用LLM的`json_schema`响应格式确保结构化输出
- 设置`strict: true`强制遵守Schema
- 包含错误处理和重试逻辑

**`identifyMethodologicalFlaws(trial: TrialInfo)`**

识别试验中的方法学漏洞。

**输入：** 试验信息对象

**输出：**
```typescript
Array<{
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  recommendation: string;
}>
```

**检测的漏洞类型：**
- 分配隐藏不足
- 盲法设计缺陷
- 缺失数据处理不当
- 统计功效不足
- 多重比较未校正
- 选择性报告
- 替代终点使用不当

**`generateCommentary(trial: TrialInfo, flaws: Flaw[])`**

生成500词英文Commentary。

**输入：**
- 试验信息
- 识别出的漏洞列表

**输出：**
```typescript
{
  content: string;  // Markdown格式
  wordCount: number;
}
```

**Commentary结构：**
1. Background and Objective (100词)
2. Methodological Assessment (150词)
3. Results Interpretation (100词)
4. Limitations and Concerns (100词)
5. Clinical Implications (50词)

**质量控制：**
- 严格控制在500词（±10词容差）
- 引用具体数据和统计指标
- 使用专业、客观的学术语言
- 避免夸张表述
- 符合NEJM/Lancet/JAMA投稿标准

---

### PubMed服务 (pubmedService.ts)

负责与PubMed API交互。

#### 核心函数

**`searchPubMed(query: string, maxResults: number)`**

搜索PubMed数据库。

**API端点：** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`

**参数：**
- `db=pubmed`
- `term={query} AND 2025:2030[dp] AND Clinical Trial[pt]`
- `retmax={maxResults}`
- `retmode=json`

**返回：** PMID列表

**`fetchTrialDetails(pmids: string[])`**

批量获取试验详情。

**API端点：** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`

**参数：**
- `db=pubmed`
- `id={pmids.join(',')}`
- `retmode=xml`

**解析字段：**
- PMID
- DOI
- 标题
- 作者列表
- 期刊名称
- 发表日期
- 摘要
- PMC ID（如有）

**速率限制：**
- 无API密钥：3请求/秒
- 有API密钥：10请求/秒

---

### PDF服务 (pdfService.ts)

负责PDF下载和文本提取。

#### 核心函数

**`downloadPDF(pdfUrl: string)`**

下载PDF文件。

**支持的URL格式：**
- PMC免费全文：`https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{id}/pdf/`
- DOI解析：`https://doi.org/{doi}`

**返回：** Buffer（PDF二进制数据）

**错误处理：**
- 403 Forbidden：期刊需要订阅
- 404 Not Found：PDF不存在
- 超时：30秒后中止

**`uploadPDFToS3(pdfBuffer: Buffer, trialId: number)`**

上传PDF到S3存储。

**文件路径：** `trials/{trialId}/fulltext-{timestamp}.pdf`

**返回：** S3 URL

**`extractTextFromPDF(pdfBuffer: Buffer)`**

提取PDF文本内容。

**使用库：** pdf-parse

**返回：**
```typescript
{
  text: string;
  numpages: number;
  info: object;
}
```

**限制：**
- 扫描版PDF无法提取
- 复杂布局可能乱序
- 图表内容丢失

---

### 数据采集服务 (dataCollectionService.ts)

协调数据抓取、分析和存储的完整流程。

#### 核心函数

**`processAndStoreTrial(rawTrial: RawTrialData)`**

处理并存储单个试验。

**工作流程：**
1. 下载PDF全文（如有）
2. 上传到S3
3. 提取文本内容
4. 使用NLP服务分析
5. 识别方法学漏洞
6. 生成Commentary
7. 保存到数据库

**`importTrialManually(trialData: ManualImportData)`**

手动导入试验（管理员功能）。

**`matchSubscriptions(trial: Trial)`**

匹配用户订阅并发送通知。

**匹配逻辑：**
- 疾病名称匹配
- 试验阶段匹配
- 期刊名称匹配
- 关键词匹配
- 样本量阈值

---

### 通知服务 (notificationService.ts)

负责发送用户通知。

#### 核心函数

**`sendEmailNotification(userId: number, trial: Trial)`**

发送邮件通知。

**邮件模板：**
- 主题：New Clinical Trial Matching Your Interests
- 内容：试验摘要、关键结果、查看链接

**`sendAppNotification(userId: number, trial: Trial)`**

发送应用内通知（使用Manus通知API）。

**`createNotificationHistory(subscriptionId: number, trialId: number)`**

记录通知历史。

---

### 文档导出服务 (documentExportService.ts)

负责导出Commentary为各种格式。

#### 核心函数

**`exportToMarkdown(commentary: Commentary)`**

导出为Markdown格式。

**返回：** Markdown文本

**`exportToPDF(commentary: Commentary)`**

导出为PDF格式（未实现）。

**建议库：** pdfkit, puppeteer

**`exportToWord(commentary: Commentary)`**

导出为Word格式（未实现）。

**建议库：** docx

---

## 前端架构

### 页面组件

#### Home.tsx

主页，展示2026年最新临床试验列表。

**数据源：**
```typescript
const { data: trials } = trpc.trials.getRecent.useQuery({ year: 2026 });
```

**功能：**
- 试验卡片列表
- 倒序排列（最新在前）
- 点击跳转到详情页

#### PubMedSearch.tsx

PubMed搜索页面。

**功能：**
- 关键词搜索
- 期刊筛选
- 搜索结果展示
- 一键分析按钮

**关键逻辑：**
```typescript
const searchMutation = trpc.pubmed.search.useQuery({ query, journal });
const importMutation = trpc.pubmed.importAndAnalyze.useMutation({
  onSuccess: (data) => {
    router.push(`/trial/${data.trialId}`);
  }
});
```

#### TrialDetail.tsx

试验详情页。

**数据源：**
```typescript
const { data } = trpc.trials.getById.useQuery({ id: trialId });
const { data: comments } = trpc.comments.getByTrialId.useQuery({ trialId });
```

**功能：**
- 试验基本信息展示
- 方法学漏洞列表（按严重程度分类）
- Commentary展示和编辑
- PDF下载链接
- 期刊投稿链接

#### Search.tsx

高级搜索页面。

**功能：**
- 多条件筛选（期刊、阶段、适应症、样本量、日期范围）
- 搜索结果展示
- 结果导出

#### Subscriptions.tsx

订阅管理页面。

**功能：**
- 订阅列表展示
- 创建新订阅
- 编辑/删除订阅
- 启用/禁用订阅

#### Profile.tsx

用户个人中心。

**功能：**
- 用户信息展示
- 历史评论列表
- 笔记管理
- 导出文档列表

---

### UI组件库

使用shadcn/ui提供的组件：

| 组件 | 用途 |
|------|------|
| Button | 按钮操作 |
| Card | 内容卡片 |
| Input | 文本输入 |
| Select | 下拉选择 |
| Dialog | 对话框 |
| Table | 数据表格 |
| Badge | 标签徽章 |
| Skeleton | 加载骨架屏 |
| Toast | 消息提示 |
| Tabs | 标签页 |

---

## 配置与环境

### 环境变量

所有环境变量已由Manus平台自动注入，无需手动配置。

**系统环境变量：**
- `DATABASE_URL` - MySQL连接字符串
- `JWT_SECRET` - Session签名密钥
- `VITE_APP_ID` - OAuth应用ID
- `OAUTH_SERVER_URL` - OAuth后端URL
- `BUILT_IN_FORGE_API_URL` - Manus API基础URL
- `BUILT_IN_FORGE_API_KEY` - API认证令牌
- `VITE_FRONTEND_FORGE_API_KEY` - 前端API令牌

**访问方式：**
```typescript
// 服务端
import { ENV } from './server/_core/env';
console.log(ENV.databaseUrl);

// 客户端
console.log(import.meta.env.VITE_APP_ID);
```

---

## 部署架构

### 生产环境

**构建命令：**
```bash
pnpm build
```

**输出：**
- `dist/` - 后端打包文件
- `dist/client/` - 前端静态资源

**启动命令：**
```bash
NODE_ENV=production node dist/index.js
```

**端口：** 3000（可通过环境变量`PORT`覆盖）

### 数据库迁移

**开发环境：**
```bash
pnpm db:push  # 自动生成并应用迁移
```

**生产环境：**
```bash
drizzle-kit generate  # 仅生成迁移文件
drizzle-kit migrate   # 应用迁移
```

### S3配置

**桶权限：** 公开读取

**CORS配置：**
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## 性能监控

### 日志文件

- `.manus-logs/devserver.log` - 服务器日志
- `.manus-logs/browserConsole.log` - 浏览器控制台
- `.manus-logs/networkRequests.log` - 网络请求
- `.manus-logs/sessionReplay.log` - 用户交互

### 关键指标

**后端：**
- API响应时间（目标：<500ms）
- 数据库查询时间（目标：<100ms）
- LLM调用时间（目标：<10s）
- PDF下载时间（目标：<30s）

**前端：**
- 首屏加载时间（目标：<2s）
- 页面切换时间（目标：<300ms）
- 交互响应时间（目标：<100ms）

---

## 安全最佳实践

### 1. 输入验证

所有用户输入必须经过Zod验证：
```typescript
.input(z.object({
  pmid: z.string().regex(/^\d+$/),
  year: z.number().min(2000).max(2030)
}))
```

### 2. 权限控制

使用`protectedProcedure`保护敏感API：
```typescript
adminProcedure: protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
})
```

### 3. SQL注入防护

使用Drizzle ORM自动转义：
```typescript
// ✅ 安全
await db.select().from(trials).where(eq(trials.id, userId));

// ❌ 危险
await db.execute(sql`SELECT * FROM trials WHERE id = ${userId}`);
```

### 4. XSS防护

React自动转义HTML，避免使用`dangerouslySetInnerHTML`。

### 5. CSRF防护

使用SameSite Cookie：
```typescript
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

---

## 故障排查

### 常见问题

**1. 数据库连接失败**

检查`DATABASE_URL`环境变量是否正确。

**2. LLM调用超时**

增加超时时间或检查API密钥。

**3. PDF下载403错误**

期刊需要订阅，尝试PMC免费全文。

**4. tRPC类型错误**

运行`pnpm check`检查TypeScript错误。

**5. 前端白屏**

检查浏览器控制台错误，查看`.manus-logs/browserConsole.log`。

---

## 扩展建议

### 1. 添加缓存层

使用Redis缓存LLM响应和PubMed搜索结果。

### 2. 实现批量分析

支持一次性分析多篇论文。

### 3. PDF图表提取

使用pdf2image或PyMuPDF提取图表。

### 4. 定时任务

每日自动抓取新论文并匹配订阅。

### 5. 邮件服务

集成SendGrid或AWS SES发送通知邮件。

---

**下一步：** 阅读`OPTIMIZATION_ROADMAP.md`了解待优化功能清单。
