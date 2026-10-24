# 一枕清欢

古风清新的个人梦向创作与存档网站。仓库保留当前完整页面与功能：双人档案、故事时间线、灵感标签、画稿原图、传讯记录、待问整理、AI 灵感助手、选择性备份/导入、Word/PDF 成卷和原图下载。

## 推荐方式：直接使用 GitHub Pages

此仓库已经把原本依赖云端数据库和图片存储的功能转换为浏览器本地数据库，因此可以只依赖 GitHub Pages 运行：

- 文字、标签、故事线和档案保存在浏览器 IndexedDB。
- 上传的画稿与聊天截图以原始文件内容保存在浏览器数据库。
- 新增、修改、删除、拖动排序、搜索、AI 灵感辅助、Word/PDF 下载、原图下载均可继续使用。
- “藏卷”备份会包含文字和图片，可用于换设备、换浏览器或清除缓存前迁移数据。
- 私人内容不会被写入 GitHub 仓库，也不会自动上传给第三方数据库。

### 发布步骤

1. 在 GitHub 新建一个仓库，建议使用 Private；如需免费 GitHub Pages，也可以根据自己的 GitHub 套餐选择 Public。
2. 把本目录中的全部文件上传到仓库根目录，并确保默认分支名为 `main`。
3. 打开仓库的 `Settings → Pages`，在 `Build and deployment` 中选择 `GitHub Actions`。
4. 打开 `Actions → Deploy GitHub Pages`，等待部署成功。
5. GitHub 会显示网站地址，之后每次推送到 `main` 都会自动更新页面。

本地预览 GitHub Pages 版本：

```bash
npm install
npm run dev:pages
```

构建 GitHub Pages 文件：

```bash
npm run build:pages
```

### 本地数据的重要说明

GitHub Pages 是静态托管，因此每个浏览器拥有自己独立的数据。第一次使用后，建议定期打开“藏卷 → 备份”并下载完整备份。换手机或电脑时，在新设备打开网站后使用“藏卷 → 导入”即可恢复。

## 可选方式：Cloudflare 云端同步版

如果希望多台设备自动看到同一份数据，可以使用仓库保留的 Cloudflare Workers 版本。GitHub 负责保存源码、记录版本和触发部署，Cloudflare 负责：

- `DB`（Cloudflare D1）：保存档案、故事、标签、时间线等文字数据。
- `ARCHIVE`（Cloudflare R2）：保存画稿、聊天截图与其他上传原图。
- `app/api/`：提供新增、修改、删除、上传和下载接口。

这部分不是 GitHub Pages 的必需项；不配置 Cloudflare 也不会影响上面的纯 GitHub Pages 版本。

## 仓库内不包含什么

这是一份干净源码，不包含你在线上填写的私人文字、聊天截图、画稿或数据库内容。迁移现有数据时：

1. 在原网站打开右侧“藏卷”。
2. 选择全部页面并下载备份。
3. 部署新网站。
4. 在新网站“藏卷 → 导入”中恢复备份。

备份文件会包含图片，因此不要把它提交到公开 GitHub 仓库。

## 上传源码到 GitHub

1. 在 GitHub 新建一个空仓库，建议设为 **Private**。
2. 解压本项目，把本目录内的全部文件上传到仓库根目录。
3. GitHub 会自动运行 `Build check`，确认页面可以正常构建。

也可以使用 Git：

```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin 你的仓库地址
git push -u origin main
```

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

检查正式构建：

```bash
npm run build
```

## 第一次准备 Cloudflare

安装并登录 Wrangler：

```bash
npx wrangler login
```

创建数据库与原图存储桶：

```bash
npx wrangler d1 create yizhen-qinghuan-db
npx wrangler r2 bucket create yizhen-qinghuan-archive
```

请保存第一条命令返回的 `database_id`。

随后在 GitHub 仓库打开 `Settings → Secrets and variables → Actions`，建立以下 **Repository secrets**：

| 名称 | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 具有 Workers、D1、R2 部署权限的 Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_D1_DATABASE_ID` | 创建 D1 后返回的 database_id |
| `CLOUDFLARE_D1_DATABASE_NAME` | `yizhen-qinghuan-db` |
| `CLOUDFLARE_R2_BUCKET_NAME` | `yizhen-qinghuan-archive` |

可选建立一个 **Repository variable**：

| 名称 | 内容 |
| --- | --- |
| `CLOUDFLARE_WORKER_NAME` | 自定义网站 Worker 名；不填时使用 `yizhen-qinghuan` |

## 从 GitHub 部署

1. 打开仓库的 `Actions`。
2. 选择 `Deploy to Cloudflare`。
3. 点击 `Run workflow`。

流程会自动完成：安装依赖、构建网站、创建数据库表、绑定 D1/R2 并部署。部署配置由 GitHub Secrets 临时生成，不会把账户 ID、数据库 ID 或令牌提交到仓库。

## 后续更新

修改源码并推送后，`Build check` 会自动检查。确认通过后，再到 Actions 手动运行 `Deploy to Cloudflare`，即可更新正式网站。

## 隐私与安全

- 建议使用 GitHub 私人仓库。
- 不要提交 `.env`、`.wrangler-deploy.json`、备份 JSON、聊天截图或私人画稿。
- `.gitignore` 已排除依赖、构建目录、本地 Cloudflare 状态和临时部署配置。
- 如果需要限制网站访问，可在 Cloudflare Zero Trust 中为 Worker 域名配置 Access 登录策略。
