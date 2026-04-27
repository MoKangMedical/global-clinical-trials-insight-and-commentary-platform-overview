# 部署指南

## 快速部署（推荐）

### 方案1: Render（免费，推荐）

Render是一个现代化的云平台，支持Python和Node.js，免费额度充足。

#### 步骤：

1. **注册Render账号**
   - 访问 https://render.com
   - 使用GitHub账号注册

2. **连接GitHub仓库**
   - 将项目推送到GitHub
   - 在Render中连接GitHub仓库

3. **配置部署**
   - Render会自动检测render.yaml配置
   - 点击"Apply"开始部署

4. **获取部署URL**
   - 部署完成后会获得URL
   - 例如: https://clinical-trials-api.onrender.com

#### 优点：
- ✅ 完全免费
- ✅ 自动部署
- ✅ 支持自定义域名
- ✅ 内置SSL证书
- ✅ 自动休眠（节省资源）

#### 缺点：
- ⚠️ 免费版有冷启动时间
- ⚠️ 免费版每月750小时

---

### 方案2: Vercel（快速，适合前端）

Vercel是Next.js的官方部署平台，前端部署非常快。

#### 步骤：

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
   vercel --prod
   ```

4. **配置环境变量**
   - 在Vercel控制台设置环境变量
   - 包括API密钥、数据库URL等

#### 优点：
- ✅ 部署速度极快
- ✅ 全球CDN
- ✅ 自动HTTPS
- ✅ 适合静态站点

#### 缺点：
- ⚠️ 免费版有限制
- ⚠️ 需要配置环境变量

---

## 本地开发

### 启动后端

```bash
cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
source venv/bin/activate
python src/main.py
```

后端将在 http://localhost:8000 启动

### 启动前端

```bash
cd ~/Desktop/OPC/global-clinical-trials-insight-and-commentary-platform-overview
npm run dev
```

前端将在 http://localhost:3000 启动

### 测试API

```bash
# 健康检查
curl http://localhost:8000/health

# 获取试验列表
curl http://localhost:8000/api/trials

# 导入示例数据
curl -X POST http://localhost:8000/api/sample-data

# 测试Unpaywall
curl "http://localhost:8000/api/unpaywall/test?doi=10.1056/NEJMoa2500101"
```

---

## 环境变量说明

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DATABASE_URL | 数据库连接URL | sqlite:///clinical_trials.db |
| OPENAI_API_KEY | OpenAI API密钥 | sk-... |
| PUBMED_API_KEY | PubMed API密钥 | 1234567890 |
| UNPAYWALL_EMAIL | Unpaywall邮箱 | research@example.com |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| APP_PORT | 应用端口 | 8000 |
| APP_DEBUG | 调试模式 | True |
| LOG_LEVEL | 日志级别 | INFO |
| AWS_ACCESS_KEY_ID | AWS访问密钥 | - |
| AWS_SECRET_ACCESS_KEY | AWS秘密密钥 | - |
| SENDGRID_API_KEY | SendGrid API密钥 | - |

---

## 获取API密钥

### OpenAI API

1. 访问 https://platform.openai.com
2. 注册账号并登录
3. 进入API Keys页面
4. 创建新的API Key
5. 复制密钥到环境变量

### PubMed API

1. 访问 https://www.ncbi.nlm.nih.gov/account/
2. 注册账号并登录
3. 进入API Key管理页面
4. 创建新的API Key
5. 复制密钥到环境变量

### Unpaywall

1. 访问 https://unpaywall.org
2. 使用邮箱注册
3. 邮箱即为API标识

### SendGrid（邮件通知）

1. 访问 https://sendgrid.com
2. 注册免费账号
3. 进入Settings -> API Keys
4. 创建新的API Key
5. 复制密钥到环境变量

---

## 故障排除

### 问题1: 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8000

# 杀掉进程
kill -9 <PID>
```

### 问题2: 依赖安装失败

```bash
# 清除npm缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题3: Python依赖问题

```bash
# 重新创建虚拟环境
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 问题4: 数据库错误

```bash
# 删除数据库文件
rm clinical_trials.db

# 重新启动后端（会自动创建数据库）
python src/main.py
```

---

## 监控和日志

### 查看日志

```bash
# 后端日志
tail -f /var/log/clinical-trials/app.log

# 系统日志
journalctl -u clinical-trials
```

### 性能监控

- Render: 内置监控面板
- Vercel: 内置分析
- 自定义: 使用Sentry进行错误追踪

---

## 更新部署

### 自动部署（推荐）

- 连接GitHub仓库后，每次推送代码都会自动部署
- Render和Vercel都支持自动部署

### 手动部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
vercel --prod
# 或
render blueprint launch
```

---

## 安全建议

1. **使用环境变量** - 不要在代码中硬编码密钥
2. **定期轮换密钥** - 定期更换API密钥
3. **限制访问** - 使用IP白名单或API密钥
4. **启用HTTPS** - 确保所有通信加密
5. **监控日志** - 定期检查异常访问

---

## 成本估算

### Render免费版

- 750小时/月
- 512MB RAM
- 共享CPU
- 适合小型项目

### Vercel免费版

- 100GB带宽/月
- 无限静态站点
- 1000分钟构建时间
- 适合前端项目

### 升级选项

- Render Pro: $7/月
- Vercel Pro: $20/月
- 自托管: 根据服务器配置

---

## 下一步

1. ✅ 配置环境变量
2. ✅ 推送代码到GitHub
3. ✅ 部署到Render或Vercel
4. ✅ 测试生产环境
5. ✅ 配置自定义域名（可选）
6. ✅ 设置监控和告警（可选）

---

如有问题，请参考：
- Render文档: https://render.com/docs
- Vercel文档: https://vercel.com/docs
- 项目README: README.md
