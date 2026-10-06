# zika 字卡云同步后端 — 部署指南

## 这是什么

账号（邮箱+密码注册/登录）与生字本跨设备同步的后端，运行在 Cloudflare Pages Functions 上，
存储用 D1（数据库）+ KV（会话令牌）。部署后前端字卡通过 `/api/*` 调用。

## 项目结构

```
zika-cloud/
├── schema.sql               # D1 建表语句
├── wrangler.toml            # 资源绑定配置
├── public/                  # 前端文件放这里（index.html 等，部署后覆盖线上旧版）
└── functions/
    ├── _middleware.js       # CORS / OPTIONS 预检
    ├── _lib.js              # 公共库（密码哈希、会话、鉴权）
    └── api/
        ├── register.js      # POST /api/register
        ├── login.js         # POST /api/login
        ├── logout.js        # POST /api/logout
        ├── me.js            # GET  /api/me
        └── sync.js          # GET/PUT /api/sync（生字本同步）
```

## 第一步：创建资源（任选 A 命令行 或 B 控制台）

### A. 命令行（需要本机/云机装 wrangler）
```bash
npm i -g wrangler
wrangler login   # 浏览器授权

wrangler d1 create zika
# 记录返回的 database_id

wrangler kv namespace create ZIKA_SESSIONS
# 记录返回的 id

# 把两个 ID 填入 wrangler.toml

wrangler d1 execute zika --file=schema.sql   # 建表
```

### B. 控制台（不装命令行）
1. Cloudflare 控制台 → Workers 与 Pages → **D1** → 创建数据库 `zika`，复制 Database ID
2. → **KV** → 创建命名空间 `ZIKA_SESSIONS`，复制 Namespace ID
3. 稍后在 Pages 项目 Settings → Bindings 里添加：
   - D1：变量名 `DB` → 选 zika
   - KV：变量名 `KV` → 选 ZIKA_SESSIONS

## 第二步：部署后端

**重要**：带 Functions 的项目**不能**用“直接上传”（Direct Upload），必须二选一：

- **方式 1（推荐，你熟悉）**：把 `zika-cloud/` 推送（或上传文件）到 GitHub 仓库 → Cloudflare Pages 新建项目连接该仓库 → 构建命令留空（纯静态）→ 部署后 Pages 自动识别 `functions/` 目录。然后在项目 Settings → Bindings 绑定上面的 DB / KV。
- **方式 2**：`wrangler pages deploy .`（在 zika-cloud 目录执行，可配合 `--project-name zika`）。

## 第三步：放前端文件

把改造后的字卡 `index.html`（v3.12+，含登录/同步界面）放进 `zika-cloud/public/`，与 functions 一起部署。
部署后访问 `https://zika.2001002.xyz/` 即为最新字卡。

## 接口一览（全部带 CORS，支持本地 file:// 页面跨域调用）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/register | 注册 `{email, password}` → `{token, email}` |
| POST | /api/login | 登录 `{email, password}` → `{token, email}` |
| POST | /api/logout | 注销（Header: `Authorization: Bearer <token>`） |
| GET | /api/me | 校验令牌 → `{email}` |
| GET | /api/sync | 拉取生字本 `{chars:{字:true}}` |
| PUT | /api/sync | 推送生字本（与云端取并集，`{chars:{...}}`） |

## 安全说明（当前简化，够家庭使用）

- 密码 PBKDF2-SHA256 ×10 万次 + 随机盐，不存明文
- 会话令牌随机 32 字节，存 KV，30 天有效；登出即失效
- 未做邮箱验证（注册即用）；未做暴力破解限速（如需可后续加 KV 计数器）
- 生字本同步策略：登录时与云端**取并集**；本地每次改动全量推送，以最后操作为准
