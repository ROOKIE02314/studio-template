# Step Studio — 工作室主站设计

品牌与数字体验设计工作室的纯静态站点模板。按仓库 `sites/<id>/index.html` 的约定收录，无需安装依赖或构建。

## 本地预览

在仓库根目录运行：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080/sites/step-studio/>。也可以只将本目录交给静态服务器或静态托管平台，入口为 [index.html](./index.html)。由于使用 ES Modules，请通过 HTTP 访问，不要直接使用 `file://`。

## 文件结构

```text
step-studio/
├── index.html
├── assets/
│   ├── tokens.css       # 品牌设计令牌、字体栈与深浅主题
│   ├── studio.css       # 响应式布局和 SVG 动效
│   ├── studio.js        # 主题、滚动显现、计数、导航与磁吸交互
│   ├── dotmatrix.js     # 点阵字标渲染器（studio.js 的依赖）
│   └── svg/mark.svg     # favicon
├── preview/            # Studio 上架素材，不是网站运行依赖
│   ├── cover.png       # 默认封面与视频加载失败回退
│   └── video.mp4       # hover、选中后输入框和详情预览的录制视频
└── README.md
```

插画直接内嵌于 HTML，不依赖外部图片。发布时将 `index.html` 和整个 `assets/` 放在同一目录即可，无需 iframe 或后端服务。

## Studio 模板预览素材

本模板遵循[仓库统一的预览素材约束](../../README.md#gallery-preview-assets)，同时保存两个独立文件：

- [preview/cover.png](./preview/cover.png)：PNG 封面，1280 × 645，取自本次用户提供录像的第 3 秒帧，用于默认展示、加载期间及视频播放失败时回退。
- [preview/video.mp4](./preview/video.mp4)：本次用户提供的 Step Studio 实录，转为 H.264 MP4，1280 × 646、30 fps、约 23.33 秒、4.84 MiB、无音轨，已启用 faststart。画幅与封面仅有转码偶数尺寸取整差异，不拉伸内容。

Studio 模板卡片 hover/键盘聚焦、选中后的输入框预览及详情弹窗使用同一视频，静音循环并内联播放。这里的素材是 Studio 模板展示用录制内容，不需要加入网站页面，也不是网站自身的交互功能。

后续更新本模板展示内容时，必须同步更新封面和视频，保留 `preview/cover.png` 与 `preview/video.mp4` 的固定路径；这两个文件与模板代码一起版本管理。当前 Studio 使用复制到 public 目录的静态素材，仓库文件不会自动同步或自动上架，接入时需按根 README 清单更新素材与模板版本。

## 功能与使用边界

- 深浅主题切换，使用 `localStorage` 保存选择，并以系统配色偏好作为默认值。
- 点阵字标、成果卡滚动显现与 SVG 悬停动效。
- 工作室数字计数、滚动进度条和导航定位高亮。
- 磁吸按钮与触屏成果卡自动播放；支持 `prefers-reduced-motion`。
- Google Fonts 为唯一外部运行资源：Noto Serif SC、Noto Sans SC、PT Mono。字体无法加载时使用系统字体回退，不影响本地内容与交互；离线展示时字形可能与线上不同。
- 项目插画、客户名单、数据、邮件地址和社交入口均来自原始 demo。插画是占位素材，项目卡片跳到联系区；社交链接也为占位锚点，并非真实项目详情页或社交账号。正式使用前应替换相应内容。

## 许可与署名

页面标注 `STEP STUDIO © 2026`，未提供明确的源码许可，不额外宣称 MIT 或无限制商用许可。对外再分发前请向权利方确认授权，并保留页面署名。Google Fonts 字体依据 SIL Open Font License 1.1 使用。
