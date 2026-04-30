# Clinical Trials Platform - 部署与维护指南

**版本：** v5.0

**作者：** Manus AI

**最后更新：** 2026-01-25

---

## 目录

1. [环境准备](#环境准备)
2. [本地开发部署](#本地开发部署)
3. [生产环境部署](#生产环境部署)
4. [环境变量配置](#环境变量配置)
5. [数据库管理](#数据库管理)
6. [监控与日志](#监控与日志)
7. [备份与恢复](#备份与恢复)
8. [常见问题排查](#常见问题排查)
9. [安全最佳实践](#安全最佳实践)
10. [性能优化](#性能优化)

---

## 环境准备

### 系统要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| Node.js | v22.x | v22.13.0+ |
| pnpm | v10.x | v10.15.1+ |
| MySQL | v8.0+ | v8.0.32+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 10GB | 50GB+ (用于PDF存储) |
| 操作系统 | Ubuntu 22.04 / macOS | Ubuntu 22.04 LTS |

### 依赖安装

#### 1. 安装Node.js和pnpm

```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.13.0
nvm use 22.13.0

# 安装pnpm
npm install -g pnpm@10.15.1
```

#### 2. 安装MySQL

**Ubuntu:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql@8.0
brew services start mysql@8.0
```

#### 3. 安装系统依赖

```bash
# PDF处理依赖
sudo apt install poppler-utils  # Ubuntu
brew install poppler            # macOS

# 图像处理依赖
sudo apt install libvips-dev    # Ubuntu
brew install vips               # macOS
```

---

## 本地开发部署

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd clinical-trials-platform
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建`.env`文件（参考[环境变量配置](#环境变量配置)章节）：

```bash
cp .env.example .env
# 编辑.env文件，填入实际配置
nano .env
```

### 4. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE clinical_trials CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 推送Schema
pnpm db:push
```

### 5. 导入示例数据（可选）

```bash
node scripts/import2026Data.mjs
```

### 6. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看应用。

### 7. 运行测试

```bash
# 单元测试
pnpm test

# TypeScript类型检查
pnpm check

# 代码格式化
pnpm format
```

---

## 生产环境部署

### 方案A：Manus平台部署（推荐）

Manus平台提供一键部署，无需手动配置服务器。

#### 步骤

1. **保存检查点**：
   ```bash
   # 在Manus Agent中执行
   webdev_save_checkpoint
   ```

2. **点击发布按钮**：
   - 在Manus管理界面点击"Publish"
   - 选择域名（可使用自动生成的`xxx.manus.space`或绑定自定义域名）
   - 确认发布

3. **配置环境变量**：
   - 在Manus设置页面添加生产环境变量
   - 确保所有敏感信息（API密钥、数据库密码）已配置

4. **验证部署**：
   - 访问生产域名
   - 测试关键功能（登录、搜索、分析）
   - 检查日志无错误

#### 自定义域名绑定

1. 在Manus设置 → 域名管理
2. 添加自定义域名（如`trials.yourcompany.com`）
3. 在DNS提供商添加CNAME记录：
   ```
   trials.yourcompany.com  CNAME  xxx.manus.space
   ```
4. 等待DNS生效（通常5-30分钟）
5. 在Manus平台启用SSL证书（自动）

---

### 方案B：自托管部署

如果需要完全控制服务器，可选择自托管。

#### 1. 准备服务器

推荐使用云服务商（AWS、GCP、Azure、阿里云等）：

| 配置 | 说明 |
|------|------|
| 实例类型 | 2核4GB（最低）/ 4核8GB（推荐） |
| 操作系统 | Ubuntu 22.04 LTS |
| 存储 | 50GB SSD |
| 网络 | 公网IP + 防火墙 |

#### 2. 安装运行时环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# 安装Nginx（反向代理）
sudo apt install nginx

# 安装PM2（进程管理）
npm install -g pm2
```

#### 3. 配置MySQL

```bash
# 登录MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE clinical_trials CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trials_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON clinical_trials.* TO 'trials_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 4. 部署应用

```bash
# 克隆代码
cd /var/www
sudo git clone <your-repo-url> clinical-trials-platform
cd clinical-trials-platform

# 安装依赖
sudo pnpm install

# 配置环境变量
sudo nano .env
# 填入生产环境配置

# 构建应用
sudo pnpm build

# 推送数据库Schema
sudo pnpm db:push

# 使用PM2启动
sudo pm2 start dist/index.js --name clinical-trials
sudo pm2 save
sudo pm2 startup
```

#### 5. 配置Nginx反向代理

```bash
sudo nano /etc/nginx/sites-available/clinical-trials
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name trials.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/clinical-trials /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 配置SSL证书（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d trials.yourcompany.com

# 自动续期
sudo certbot renew --dry-run
```

#### 7. 配置防火墙

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 环境变量配置

### 必需变量

创建`.env`文件，包含以下变量：

```bash
# 数据库配置
DATABASE_URL="mysql://trials_user:your_password@localhost:3306/clinical_trials"

# JWT密钥（用于会话签名）
JWT_SECRET="your-random-secret-key-min-32-chars"

# OAuth配置（Manus平台自动注入，自托管需手动配置）
VITE_APP_ID="your-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
OWNER_OPEN_ID="your-owner-open-id"
OWNER_NAME="Your Name"

# LLM API配置（Manus平台自动注入）
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-forge-api-key"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-forge-key"
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# S3存储配置（Manus平台自动注入）
S3_ENDPOINT="https://s3.amazonaws.com"
S3_BUCKET="your-bucket-name"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_REGION="us-east-1"

# 应用配置
NODE_ENV="production"
PORT=3000

# 分析配置（可选）
VITE_ANALYTICS_ENDPOINT="https://analytics.yourcompany.com"
VITE_ANALYTICS_WEBSITE_ID="your-website-id"
```

### 可选变量

```bash
# 邮件服务（SendGrid）
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourcompany.com"

# 错误追踪（Sentry）
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Redis缓存（性能优化）
REDIS_URL="redis://localhost:6379"

# 机构代理（PDF下载）
INSTITUTIONAL_PROXY_URL="https://proxy.yourcompany.com"
```

### 环境变量安全

**⚠️ 重要提示：**

1. **永远不要提交`.env`文件到Git**：
   ```bash
   echo ".env" >> .gitignore
   ```

2. **使用强随机密钥**：
   ```bash
   # 生成JWT_SECRET
   openssl rand -base64 32
   ```

3. **生产环境使用密钥管理服务**：
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault

4. **定期轮换密钥**（建议每90天）

---

## 数据库管理

### Schema变更流程

当修改`drizzle/schema.ts`后：

```bash
# 1. 生成迁移文件
pnpm db:push

# 2. 查看生成的SQL
cat drizzle/migrations/*.sql

# 3. 在Staging环境测试
NODE_ENV=staging pnpm db:push

# 4. 确认无误后，在生产环境执行
NODE_ENV=production pnpm db:push
```

### 数据库备份

#### 自动备份脚本

创建`scripts/backup-db.sh`：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
DB_NAME="clinical_trials"
DB_USER="trials_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

# 全量备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

设置定时任务：

```bash
chmod +x scripts/backup-db.sh

# 添加到crontab（每天凌晨2点执行）
crontab -e
# 添加：
0 2 * * * /var/www/clinical-trials-platform/scripts/backup-db.sh
```

#### 手动备份

```bash
# 导出
mysqldump -u trials_user -p clinical_trials > backup.sql

# 导入
mysql -u trials_user -p clinical_trials < backup.sql
```

### 数据库优化

#### 添加索引

```sql
-- 在生产环境执行前，先在Staging测试
USE clinical_trials;

-- 试验表索引
CREATE INDEX idx_trials_published_date ON trials(publishedDate);
CREATE INDEX idx_trials_journal ON trials(journal);
CREATE INDEX idx_trials_indication ON trials(indication);

-- 订阅表索引
CREATE INDEX idx_subscriptions_user_id ON subscriptions(userId);
CREATE INDEX idx_subscriptions_active ON subscriptions(active);

-- 查看索引使用情况
SHOW INDEX FROM trials;
```

#### 慢查询日志

```bash
# 启用慢查询日志
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加：
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 1

# 重启MySQL
sudo systemctl restart mysql

# 分析慢查询
sudo mysqldumpslow /var/log/mysql/slow-query.log
```

---

## 监控与日志

### 应用日志

#### PM2日志管理

```bash
# 查看实时日志
pm2 logs clinical-trials

# 查看错误日志
pm2 logs clinical-trials --err

# 清空日志
pm2 flush

# 日志轮转配置
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### 自定义日志

在`server/_core/index.ts`中添加：

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 在生产环境输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export { logger };
```

### 性能监控

#### 集成Sentry（错误追踪）

```bash
pnpm add @sentry/node @sentry/react
```

在`server/_core/index.ts`中：

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

在`client/src/main.tsx`中：

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

#### 健康检查端点

在`server/routers.ts`中添加：

```typescript
health: publicProcedure.query(async () => {
  const db = await getDb();
  const dbOk = !!db;
  
  return {
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbOk ? 'connected' : 'disconnected',
  };
})
```

设置监控告警（使用UptimeRobot或Pingdom）：

```
URL: https://yourapp.com/api/trpc/health
Interval: 5分钟
Alert: 当status !== 'ok'时发送邮件/短信
```

---

## 备份与恢复

### 完整备份策略

| 数据类型 | 备份频率 | 保留期限 | 存储位置 |
|---------|---------|---------|---------|
| 数据库 | 每日全量 | 30天 | S3 + 本地 |
| PDF文件 | 实时同步 | 永久 | S3（版本控制） |
| 应用代码 | Git提交 | 永久 | GitHub |
| 配置文件 | 手动 | 永久 | 加密存储 |

### 灾难恢复流程

#### 场景1：数据库损坏

```bash
# 1. 停止应用
pm2 stop clinical-trials

# 2. 下载最新备份
aws s3 cp s3://your-bucket/backups/latest.sql.gz /tmp/

# 3. 恢复数据库
gunzip /tmp/latest.sql.gz
mysql -u trials_user -p clinical_trials < /tmp/latest.sql

# 4. 验证数据完整性
mysql -u trials_user -p -e "SELECT COUNT(*) FROM clinical_trials.trials;"

# 5. 重启应用
pm2 start clinical-trials
```

#### 场景2：服务器完全故障

```bash
# 1. 启动新服务器
# 2. 按照"生产环境部署"章节重新部署
# 3. 恢复数据库（见场景1）
# 4. 验证所有功能正常
# 5. 更新DNS指向新服务器
```

#### 场景3：S3数据丢失

S3启用版本控制后，可恢复任意时间点的文件：

```bash
# 列出文件版本
aws s3api list-object-versions --bucket your-bucket --prefix pdfs/

# 恢复特定版本
aws s3api get-object --bucket your-bucket --key pdfs/file.pdf --version-id VERSION_ID file.pdf
```

---

## 常见问题排查

### 问题1：数据库连接失败

**症状：** 应用启动时报错`Error: connect ECONNREFUSED`

**排查步骤：**

```bash
# 1. 检查MySQL是否运行
sudo systemctl status mysql

# 2. 检查端口是否监听
sudo netstat -tlnp | grep 3306

# 3. 测试连接
mysql -u trials_user -p -h localhost

# 4. 检查防火墙
sudo ufw status

# 5. 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

**解决方案：**
- 确保MySQL服务运行：`sudo systemctl start mysql`
- 检查`.env`中的`DATABASE_URL`是否正确
- 确认用户权限：`GRANT ALL PRIVILEGES ON clinical_trials.* TO 'trials_user'@'localhost';`

---

### 问题2：PDF下载失败

**症状：** 一键分析时提示"PDF下载失败"

**排查步骤：**

```bash
# 1. 检查网络连接
curl -I https://www.ncbi.nlm.nih.gov/pmc/articles/PMC123456/pdf/

# 2. 查看服务器日志
pm2 logs clinical-trials --lines 100 | grep "PDF"

# 3. 测试S3上传
aws s3 cp test.txt s3://your-bucket/test.txt
```

**解决方案：**
- 检查论文是否有PMC免费全文
- 集成Unpaywall API（见优化路线图）
- 检查S3权限配置

---

### 问题3：LLM API调用超时

**症状：** Commentary生成卡住或超时

**排查步骤：**

```bash
# 1. 检查API密钥
echo $BUILT_IN_FORGE_API_KEY

# 2. 测试API连接
curl -H "Authorization: Bearer $BUILT_IN_FORGE_API_KEY" \
     https://forge.manus.im/v1/health

# 3. 查看请求日志
pm2 logs clinical-trials | grep "invokeLLM"
```

**解决方案：**
- 增加超时时间（默认30秒）
- 检查API配额是否用尽
- 使用更快的模型（如gpt-3.5-turbo）

---

### 问题4：内存溢出

**症状：** 应用崩溃，PM2日志显示`JavaScript heap out of memory`

**排查步骤：**

```bash
# 1. 查看内存使用
pm2 monit

# 2. 检查Node.js堆大小
node -e "console.log(v8.getHeapStatistics())"

# 3. 查找内存泄漏
pm2 install pm2-logrotate
```

**解决方案：**

```bash
# 增加Node.js堆大小
pm2 delete clinical-trials
pm2 start dist/index.js --name clinical-trials --node-args="--max-old-space-size=4096"
pm2 save
```

---

## 安全最佳实践

### 1. 定期更新依赖

```bash
# 检查过时的包
pnpm outdated

# 更新所有依赖
pnpm update

# 检查安全漏洞
pnpm audit

# 自动修复
pnpm audit fix
```

### 2. 实施速率限制

在`server/_core/index.ts`中添加：

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

### 3. 启用HTTPS

**Manus平台：** 自动启用

**自托管：** 使用Let's Encrypt（见部署章节）

### 4. 数据加密

```typescript
// 加密敏感字段（如用户邮箱）
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32字节
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### 5. SQL注入防护

**✅ 已实施：** Drizzle ORM自动防护

**额外措施：**
- 永远不要拼接SQL字符串
- 使用参数化查询
- 限制数据库用户权限

---

## 性能优化

### 1. 启用Redis缓存

```bash
# 安装Redis
sudo apt install redis-server

# 安装Node.js客户端
pnpm add ioredis
```

在`server/_core/cache.ts`中：

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  await redis.set(key, JSON.stringify(value), 'EX', ttl);
}
```

在tRPC路由中使用：

```typescript
trials: router({
  getRecent: publicProcedure.query(async () => {
    const cacheKey = 'trials:recent';
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    
    const trials = await getRecentTrials();
    await cacheSet(cacheKey, trials, 600); // 缓存10分钟
    return trials;
  })
})
```

### 2. 数据库连接池

在`server/db.ts`中：

```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = drizzle(pool);
```

### 3. 前端代码分割

在`client/src/App.tsx`中：

```typescript
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const TrialDetail = lazy(() => import('./pages/TrialDetail'));
const PubMedSearch = lazy(() => import('./pages/PubMedSearch'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/trial/:id" component={TrialDetail} />
        <Route path="/pubmed" component={PubMedSearch} />
      </Switch>
    </Suspense>
  );
}
```

### 4. 图片优化

```bash
# 安装sharp（已包含）
pnpm add sharp

# 压缩图片
import sharp from 'sharp';

async function optimizeImage(inputPath: string, outputPath: string) {
  await sharp(inputPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
}
```

### 5. CDN加速

**Manus平台：** 自动启用

**自托管：** 使用Cloudflare或AWS CloudFront

---

## 维护清单

### 每日

- [ ] 检查应用健康状态（`/api/trpc/health`）
- [ ] 查看错误日志（`pm2 logs --err`）
- [ ] 监控磁盘空间（`df -h`）

### 每周

- [ ] 检查数据库备份完整性
- [ ] 查看慢查询日志
- [ ] 更新依赖包（`pnpm update`）
- [ ] 检查安全漏洞（`pnpm audit`）

### 每月

- [ ] 审查用户反馈
- [ ] 分析性能指标（响应时间、错误率）
- [ ] 清理旧日志和备份
- [ ] 更新文档

### 每季度

- [ ] 轮换密钥（JWT_SECRET、API密钥）
- [ ] 审查权限配置
- [ ] 压力测试
- [ ] 灾难恢复演练

---

## 联系支持

如遇到无法解决的问题，请联系：

- **技术支持邮箱：** medivisual@mokangmedical.cn
- **GitHub Issues：** <your-repo-url>/issues
- **文档：** 参考`DEVELOPER_GUIDE.md`和`CODE_ARCHITECTURE.md`

---

## 总结

本指南涵盖了从本地开发到生产部署的完整流程，以及日常维护和故障排查的最佳实践。建议OpenClaw在接手项目后，先在本地环境熟悉代码结构，然后在Staging环境测试新功能，最后再部署到生产环境。

**关键提示：**
1. 始终在Staging环境测试后再部署到生产
2. 定期备份数据库和关键文件
3. 监控应用性能和错误日志
4. 保持依赖包更新以修复安全漏洞
5. 遵循安全最佳实践

**下一步：** 阅读`OPTIMIZATION_ROADMAP.md`了解待优化功能清单。
