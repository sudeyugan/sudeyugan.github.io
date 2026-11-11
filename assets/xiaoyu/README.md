# 小鱼素材来源

以下文件原样复制自本地 `personalized-platform` 一隅项目，没有重新生成或修改原 PNG：

- `neutral.png`：桌面 `pixel-pet/art/assets/pixel-free-v1.png`。
- `wave.png`、`sleep.png`、`chin.png`：桌面 `pixel-pet/v2/rig/assets/` 下对应的 v3 PNG。
- `mobile.png`：移动端 `companion/assets/mobile-companion-v2.png`。

桌面原画和动作的来源、候选状态与原项目验收边界，以一隅各素材目录的 README 为准。网页不改变其验收状态。

网页在运行时用 Canvas 绘制完整原画、轻量连续形变和姿态切换。桌面眨眼取自已有闭眼姿态的眼部原画；移动端帧坐标依据同目录的 frames.json。除角色素材及其视觉校准配置外，不包含用户记录、模型凭据或操作系统接口。

## WebM 展示副本

`webm/` 中的素材来自一隅资料库现有视频，按原素材名称核对后生成适合网页展示的副本：

| 网页文件 | 原素材名称 |
| --- | --- |
| idle.webm | idlemain_alpha.webm |
| greeting.webm | greeting_alpha.webm |
| listening.webm | listening_alpha.webm |
| speaking.webm | speaking_alpha.webm |
| sleep.webm | sleepy_alpha.webm |
| hair.webm | hair_adjust_alpha.webm |

转换为宽 640 像素的 VP9 WebM，保留 alpha、去掉音轨，六段合计约 6 MB；`poster.png` 是待机片段首帧。原素材未修改。网页不会读取一隅数据库或访问其资料库，使用的都是本目录内的独立副本。


动作库增加四个展示副本：`looking.webm`（looking_alpha）、`stretch.webm`（原素材拼写 streching_alpha）、`shy.webm`（shy_alpha）、`celebrate.webm`（celebrating_alpha）。同样由既有素材缩放至宽 640 像素并保留 VP9 alpha；倾听和整理头发复用现有片段。

## 逐素材校准

`placements.js` 从一隅现有 `companion.desktop.videoPlacements` 中按本页所用的十个素材 ID 提取 `scale / x / y`，不包含其他应用设置或用户内容。视频使用 9:16 舞台，偏移单位为百分比，变换原点为 `center bottom`，与原校准界面一致。此文件为独立快照；后续在一隅重新校准时可对应更新。
