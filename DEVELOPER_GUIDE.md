# Clinical Trials Platform - 开发者快速上手指南

**项目名称：** 全球临床试验追踪与评论平台 (Global Clinical Trials Insight & Commentary Platform)

**当前版本：** v5.0 (56a73a9b)

**技术栈：** React 19 + TypeScript + tRPC 11 + Express 4 + MySQL + Tailwind 4 + LLM集成

---

## 项目概述

这是一个面向临床研究者的智能文献分析平台，提供以下核心功能：

1. **PubMed实时搜索**：自动抓取2025年后发表的临床试验论文
2. **智能分析引擎**：使用LLM深度分析论文全文，识别方法学漏洞
3. **自动评论生成**：生成500词英文Commentary供期刊投稿
4. **PDF全文处理**：自动下载、上传S3、提取文本内容
5. **用户订阅系统**：按疾病、试验阶段、期刊自定义提醒
6. **数据可视化**：展示试验设计、统计结果、漏洞分析

---

## 快速开始

### 1. 环境准备

**必需工具：**
- Node.js 22.13.0
- pnpm 10.4.1+
- MySQL 8.0+ (或TiDB)

**克隆并安装依赖：**
```bash
cd /home/ubuntu/clinical-trials-platform
pnpm install
```

### 2. 环境变量配置

项目已预配置以下系统环境变量（无需手动设置）：
- `DATABASE_URL` - MySQL连接字符串
- `JWT_SECRET` - Session签名密钥
- `VITE_APP_ID` - Manus OAuth应用ID
- `OAUTH_SERVER_URL` - OAuth后端URL
- `BUILT_IN_FORGE_API_URL` - Manus内置API（包含LLM、存储、通知）
- `BUILT_IN_FORGE_API_KEY` - API认证令牌

### 3. 数据库迁移

```bash
pnpm db:push
```

这会执行：
1. 从`drizzle/schema.ts`生成SQL迁移文件
2. 应用迁移到数据库
3. 创建8张核心表（users, trials, methodological_flaws, generated_comments, subscriptions, user_notes, exported_documents, notification_history）

### 4. 导入示例数据

```bash
# 导入2026年真实临床试验数据（5篇论文）
node scripts/import2026Data.mjs

# 或导入扩展示例数据（13篇论文）
node scripts/importExtendedSampleData.mjs
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问：`http://localhost:3000`

### 6. 运行测试

```bash
pnpm test
```

当前测试覆盖：16个单元测试（全部通过）

---

## 项目结构

```
clinical-trials-platform/
├── client/                    # 前端React应用
│   ├── public/               # 静态资源
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── Home.tsx           # 主页（2026年试验列表）
│   │   │   ├── PubMedSearch.tsx   # PubMed搜索页
│   │   │   ├── TrialDetail.tsx    # 试验详情页
│   │   │   ├── Search.tsx         # 高级搜索页
│   │   │   ├── Subscriptions.tsx  # 订阅管理页
│   │   │   └── Profile.tsx        # 用户个人中心
│   │   ├── components/      # UI组件
│   │   │   └── ui/          # shadcn/ui组件库
│   │   ├── lib/trpc.ts      # tRPC客户端配置
│   │   ├── App.tsx          # 路由配置
│   │   └── index.css        # 全局样式（NEJM红色主题）
│   └── index.html
├── server/                    # 后端Express + tRPC
│   ├── _core/               # 框架核心（OAuth、上下文、LLM）
│   │   ├── llm.ts           # LLM调用封装
│   │   ├── context.ts       # tRPC上下文
│   │   └── env.ts           # 环境变量
│   ├── routers.ts           # tRPC路由定义
│   ├── db.ts                # 数据库查询辅助函数
│   ├── nlpService.ts        # NLP分析服务
│   ├── dataCollectionService.ts  # 数据采集服务
│   ├── pubmedService.ts     # PubMed API集成
│   ├── pdfService.ts        # PDF下载和文本提取
│   ├── notificationService.ts    # 通知服务
│   ├── documentExportService.ts  # 文档导出服务
│   └── trials.test.ts       # 单元测试
├── drizzle/                   # 数据库Schema和迁移
│   └── schema.ts            # 表定义
├── shared/                    # 前后端共享代码
│   ├── const.ts             # 常量定义
│   └── journals.ts          # 95+本高影响因子期刊列表
├── scripts/                   # 数据导入脚本
│   ├── import2026Data.mjs
│   └── importExtendedSampleData.mjs
├── storage/                   # S3存储辅助函数
├── todo.md                    # 功能清单和待办事项
├── FEATURE_GUIDE.md          # 功能使用指南
└── package.json
```

---

## 核心技术概念

### 1. tRPC架构

**什么是tRPC？**
- 端到端类型安全的RPC框架
- 无需手动定义API契约，类型自动同步
- 前端直接调用后端函数，TypeScript自动推断类型

**定义API（后端）：**
```typescript
// server/routers.ts
export const appRouter = router({
  trials: router({
    getRecent: publicProcedure
      .input(z.object({ year: z.number().optional() }))
      .query(async ({ input }) => {
        return await getRecentTrials(input.year);
      }),
  }),
});
```

**调用API（前端）：**
```typescript
// client/src/pages/Home.tsx
const { data, isLoading } = trpc.trials.getRecent.useQuery({ year: 2026 });
```

**优势：**
- 类型安全：前端自动知道返回值类型
- 自动补全：IDE提示所有可用API
- 重构友好：修改后端接口，前端立即报错

### 2. 数据库操作（Drizzle ORM）

**定义表Schema：**
```typescript
// drizzle/schema.ts
export const trials = mysqlTable("trials", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  journal: varchar("journal", { length: 255 }),
  publishedDate: timestamp("publishedDate"),
  // ...更多字段
});
```

**查询数据：**
```typescript
// server/db.ts
export async function getRecentTrials(year?: number) {
  const db = await getDb();
  let query = db.select().from(trials);
  
  if (year) {
    query = query.where(sql`YEAR(${trials.publishedDate}) = ${year}`);
  }
  
  return await query.orderBy(desc(trials.publishedDate)).limit(20);
}
```

**推送Schema变更：**
```bash
pnpm db:push  # 生成迁移并应用
```

### 3. LLM集成

**调用LLM进行分析：**
```typescript
// server/nlpService.ts
import { invokeLLM } from "./_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a clinical trial methodologist..." },
    { role: "user", content: `Analyze this trial: ${fullText}` }
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "trial_analysis",
      schema: {
        type: "object",
        properties: {
          indication: { type: "string" },
          sampleSize: { type: "number" },
          // ...更多字段
        }
      }
    }
  }
});

const analysis = JSON.parse(response.choices[0].message.content);
```

**关键点：**
- 使用`response_format`强制返回结构化JSON
- 设置`strict: true`确保严格遵守Schema
- 始终在服务端调用（避免暴露API密钥）

### 4. S3文件存储

**上传文件到S3：**
```typescript
// server/pdfService.ts
import { storagePut } from "../storage";

const pdfBuffer = await downloadPDF(pdfUrl);
const fileKey = `trials/${trialId}/fulltext-${Date.now()}.pdf`;
const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

// 保存URL到数据库
await db.update(trials).set({ pdfUrl: url }).where(eq(trials.id, trialId));
```

**注意事项：**
- S3桶是公开的，URL无需签名即可访问
- 文件路径添加随机后缀防止枚举
- 元数据（URL、文件名、大小）存储在数据库

### 5. PDF文本提取

**使用pdf-parse提取文本：**
```typescript
// server/pdfService.ts
import pdfParse from "pdf-parse";

const pdfBuffer = await downloadPDF(pdfUrl);
const pdfData = await pdfParse(pdfBuffer);
const fullText = pdfData.text;  // 提取的纯文本
```

**限制：**
- 扫描版PDF无法提取文本
- 复杂布局（多栏、表格）可能乱序
- 图表内容会丢失

---

## 开发工作流

### 添加新功能的标准流程

**1. 更新数据库Schema（如需要）**
```bash
# 编辑 drizzle/schema.ts
# 添加新表或字段

pnpm db:push  # 应用变更
```

**2. 添加数据库查询函数**
```typescript
// server/db.ts
export async function getTrialsByJournal(journal: string) {
  const db = await getDb();
  return await db.select().from(trials).where(eq(trials.journal, journal));
}
```

**3. 创建tRPC路由**
```typescript
// server/routers.ts
export const appRouter = router({
  trials: router({
    getByJournal: publicProcedure
      .input(z.object({ journal: z.string() }))
      .query(({ input }) => getTrialsByJournal(input.journal)),
  }),
});
```

**4. 前端调用API**
```typescript
// client/src/pages/Search.tsx
const { data } = trpc.trials.getByJournal.useQuery({ journal: "NEJM" });
```

**5. 编写测试**
```typescript
// server/trials.test.ts
it("should filter trials by journal", async () => {
  const caller = appRouter.createCaller(createMockContext());
  const result = await caller.trials.getByJournal({ journal: "NEJM" });
  expect(result.length).toBeGreaterThan(0);
});
```

**6. 运行测试并提交**
```bash
pnpm test
pnpm check  # TypeScript类型检查
git commit -m "feat: add journal filter"
```

---

## 常见开发任务

### 任务1：添加新的数据库表

**场景：** 需要存储用户收藏的试验

```typescript
// drizzle/schema.ts
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trialId: int("trialId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

```bash
pnpm db:push
```

### 任务2：调用外部API

**场景：** 集成Crossref API获取DOI元数据

```typescript
// server/crossrefService.ts
import axios from "axios";

export async function fetchDOIMetadata(doi: string) {
  const response = await axios.get(`https://api.crossref.org/works/${doi}`);
  return response.data.message;
}
```

### 任务3：添加新页面

**1. 创建页面组件：**
```typescript
// client/src/pages/Analytics.tsx
export default function Analytics() {
  const { data } = trpc.trials.getStats.useQuery();
  return <div>统计分析页面</div>;
}
```

**2. 注册路由：**
```typescript
// client/src/App.tsx
import Analytics from "./pages/Analytics";

<Route path="/analytics" component={Analytics} />
```

### 任务4：优化LLM提示词

**场景：** 改进Commentary生成质量

```typescript
// server/nlpService.ts
const systemPrompt = `You are a senior clinical trial methodologist with extensive experience publishing in NEJM, Lancet, and JAMA.

Your task is to write a 500-word commentary for submission to the journal where this trial was published.

Structure:
1. Background and Objective (100 words)
2. Methodological Assessment (150 words)
3. Results Interpretation (100 words)
4. Limitations and Concerns (100 words)
5. Clinical Implications (50 words)

Requirements:
- Cite specific data from the trial
- Use professional, objective tone
- Avoid superlatives ("groundbreaking", "revolutionary")
- Focus on public health significance
- Identify potential biases or confounders`;
```

---

## 调试技巧

### 1. 查看服务器日志

```bash
# 实时查看开发服务器输出
tail -f .manus-logs/devserver.log

# 查看浏览器控制台日志
tail -f .manus-logs/browserConsole.log

# 查看网络请求
tail -f .manus-logs/networkRequests.log
```

### 2. 调试tRPC请求

**在浏览器DevTools中：**
- Network标签 → 筛选`/api/trpc`
- 查看请求体和响应体
- 检查错误堆栈

**在服务端添加日志：**
```typescript
// server/routers.ts
.query(async ({ input }) => {
  console.log("[DEBUG] Input:", input);
  const result = await someFunction(input);
  console.log("[DEBUG] Result:", result);
  return result;
})
```

### 3. 调试LLM响应

```typescript
// server/nlpService.ts
const response = await invokeLLM({ messages });
console.log("[LLM Response]", JSON.stringify(response, null, 2));

const content = response.choices?.[0]?.message?.content;
if (!content) {
  console.error("[LLM Error] No content in response:", response);
  throw new Error("LLM returned empty response");
}
```

### 4. 数据库查询调试

```typescript
// server/db.ts
const result = await db.select().from(trials).where(eq(trials.id, id));
console.log("[DB Query] Result:", result);
```

---

## 性能优化建议

### 1. 前端优化

**使用乐观更新（Optimistic Updates）：**
```typescript
const utils = trpc.useUtils();
const mutation = trpc.trials.favorite.useMutation({
  onMutate: async (newFavorite) => {
    await utils.trials.getFavorites.cancel();
    const prev = utils.trials.getFavorites.getData();
    utils.trials.getFavorites.setData(undefined, (old) => [...old, newFavorite]);
    return { prev };
  },
  onError: (err, newFavorite, context) => {
    utils.trials.getFavorites.setData(undefined, context.prev);
  },
});
```

**懒加载页面组件：**
```typescript
// client/src/App.tsx
import { lazy, Suspense } from "react";

const Analytics = lazy(() => import("./pages/Analytics"));

<Suspense fallback={<div>加载中...</div>}>
  <Route path="/analytics" component={Analytics} />
</Suspense>
```

### 2. 后端优化

**批量数据库查询：**
```typescript
// 避免N+1查询
const trials = await db.select().from(trials).limit(20);
const trialIds = trials.map(t => t.id);
const flaws = await db.select().from(methodological_flaws)
  .where(inArray(methodological_flaws.trialId, trialIds));
```

**缓存LLM响应：**
```typescript
// server/nlpService.ts
const cacheKey = `commentary:${trialId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const commentary = await generateCommentary(trial);
await redis.set(cacheKey, JSON.stringify(commentary), 'EX', 3600);
return commentary;
```

### 3. PDF处理优化

**限制PDF大小：**
```typescript
// server/pdfService.ts
const MAX_PDF_SIZE = 16 * 1024 * 1024; // 16MB

if (pdfBuffer.length > MAX_PDF_SIZE) {
  throw new Error("PDF file too large");
}
```

**超时控制：**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await axios.get(pdfUrl, {
    responseType: "arraybuffer",
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeout);
}
```

---

## 安全注意事项

### 1. 权限控制

**使用protectedProcedure保护敏感API：**
```typescript
// server/routers.ts
import { protectedProcedure } from "./_core/trpc";

export const appRouter = router({
  admin: router({
    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteUser(input.userId);
      }),
  }),
});
```

### 2. 输入验证

**使用Zod验证所有输入：**
```typescript
.input(z.object({
  pmid: z.string().regex(/^\d+$/),  // 只允许数字
  year: z.number().min(2000).max(2030),
  journal: z.string().max(255),
}))
```

### 3. SQL注入防护

**使用Drizzle ORM（自动转义）：**
```typescript
// ✅ 安全
await db.select().from(trials).where(eq(trials.journal, userInput));

// ❌ 危险（不要这样做）
await db.execute(sql`SELECT * FROM trials WHERE journal = '${userInput}'`);
```

### 4. XSS防护

**React自动转义HTML：**
```typescript
// ✅ 安全
<div>{userInput}</div>

// ❌ 危险
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## 部署前检查清单

- [ ] 所有测试通过（`pnpm test`）
- [ ] TypeScript无错误（`pnpm check`）
- [ ] 环境变量已配置
- [ ] 数据库迁移已应用（`pnpm db:push`）
- [ ] 示例数据已导入（可选）
- [ ] 日志级别设置为production
- [ ] 敏感信息已从代码中移除
- [ ] S3桶权限已正确配置
- [ ] CORS策略已设置
- [ ] 速率限制已启用（防止滥用）

---

## 获取帮助

**文档资源：**
- [tRPC官方文档](https://trpc.io)
- [Drizzle ORM文档](https://orm.drizzle.team)
- [React 19文档](https://react.dev)
- [Tailwind CSS文档](https://tailwindcss.com)

**项目特定文档：**
- `FEATURE_GUIDE.md` - 功能使用指南
- `todo.md` - 待办事项和已知问题
- `README.md` - 模板说明

**调试工具：**
- Chrome DevTools
- React DevTools
- tRPC DevTools（浏览器扩展）

---

**下一步：** 阅读`CODE_ARCHITECTURE.md`了解详细的代码架构设计。
