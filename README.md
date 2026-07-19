# 会同县无生中学 · ARG 游戏

纯静态站点（HTML / CSS / JS + 图片 / 视频 / PDF）。

## 部署方式
- 源码托管：GitHub（本仓库）
- 线上托管：Cloudflare Pages（从 GitHub 自动拉取部署）
- 域名：绑定自有域名（Cloudflare 边缘节点，免 ICP 备案，自动 HTTPS）
- 入口：`index.html`（自动跳转 `preamble.html`）

## 本地预览
```bash
python3 -m http.server 8125
# 浏览器打开 http://localhost:8125
```
