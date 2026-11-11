# 苏的鱼干 · 个人主页

本地静态 HTML、CSS 和原生 JavaScript。双击 `index.html` 打开，无需安装依赖、构建或启动服务。素材和视频均在本地，可离线运行。

## 修改文字

在 IDE 中编辑 **`assets/content.js`**，保存后刷新主页。昵称、联系方式、介绍、角色对白、聊天开场和能力说明都集中在这个文件中。换行使用 `\n`，`index.html` 主要负责页面结构。

网页内的文字编辑入口、编辑页面及文件导出流程已移除。

## 浏览与互动

- 滚轮／触控滚动推动横向场景，目录与底部细线导航可直接跳转，支持前进后退和 URL hash。
- 鱼指针可以连续转圈；移动时出现两道向后展宽、带明暗层次的短弧形水痕，停止后淡出；点击会激起局部断续水纹和少量水滴。背景保持静止。
- 首页名字可拖动，星号切换配色；关于我的纸片可以翻开；联系页明信片可以翻面、拖动、盖章，纸船会避让游近的鱼，也可以点击／触屏／键盘推动；切换开场时随之漂动。
- 鱼靠近卡片时，最近的一段边缘轻轻弯曲；掠过链接时，下方细线会回弹。所有反馈局限在操作附近。
- 小鱼提供 **WebM 形象**与**桌面小鱼**。WebM 的每段素材沿用一隅保存的缩放、位移参数，集中在 `assets/xiaoyu/placements.js` 中。

| 对小鱼的操作 | 触发的 WebM 动画 |
| --- | --- |
| 点头发 | 理理头发 |
| 点身体 | 害羞一下 |
| 按住约 0.72 秒再松开 | 伸个懒腰 |
| 在角色区域左右挥动鼠标 | 招手 |
| 拖动后放下 | 庆祝新位置 |

操作提示也可以直接点击。聚焦角色后，Enter／空格触发头部回应，Shift + Enter／空格触发身体回应，方向键移动位置。动作库另有倾听、思考等选择，Escape 关闭。桌面形态使用已有 PNG 姿态回应。

“陪你聊聊／日常协助／有边界的 AI”是预设的本地能力片段，不连接真实模型或私人记录。

手机上较长的场景可在场景内继续滚动。页脚可减弱动效，并尊重系统偏好；触屏不会显示额外的鱼指针或指针波纹。

## 文件结构

```text
index.html                  本地主页
assets/content.js            集中的文字与联系方式
assets/content-runtime.js    文本绑定
assets/main.js               内容切换、能力片段与联系入口
assets/pager.js              原生滚动与连续场景编排
assets/motion.js             弹性文字、游动小鱼指针
assets/art.js / .css          场景曲线、纸片、明信片和符号互动
assets/water.js              简短水痕、边缘弹性、纸船避让
assets/water.css             纸片、角色布局与轻量页脚
assets/current.css           鱼与页面的局部交互样式
assets/xiaoyu/placements.js  一隅原有逐素材视觉校准值
assets/pet.js                桌面角色渲染与互动
assets/video.js              WebM 双槽位播放与帧切换
assets/styles.css            基础视觉与响应式
assets/experience.css        滚动编排、内容层次与新展示区
assets/xiaoyu/               原项目的 PNG 与优化后的 WebM
```

## Git 与静态托管

保留本地 Git 历史，目前没有远程仓库，没有自动推送或发布配置。将本目录提交到你指定的 GitHub 仓库即可管理。资源采用相对路径，支持 GitHub Pages 项目子路径。`.nojekyll` 跳过 Jekyll 处理；`outputs/` 中的录屏、截图、备份不纳入版本管理。

可选的 HTTP 预览方式：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

然后打开 `http://localhost:8080`。直接打开 HTML 同样可用。
