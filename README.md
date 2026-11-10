# 苏的鱼干 · 个人主页

一个以暖白、钴蓝和鼠尾草绿为主色的中文个人主页。采用 React、TypeScript、Vinext 与自定义 CSS，保留 Sites 构建与部署集成。

## 本地运行

```bash
npm run dev
```

默认地址为 http://localhost:5173。首次运行前安装锁文件中的依赖。生产构建使用：

```bash
node /home/su/.codex/plugins/cache/openai-curated-remote/sites/1.1.4/scripts/build-site.mjs
```

## 内容与实现

- `lib/profile.ts`：昵称与联系方式。空联系方式显示“稍后补上”；填入真实值后自动启用复制、邮件或跳转。
- `components/personal-home.tsx`：页面结构、介绍、作品详情、话题与弹窗。
- `components/soft-sculpture.tsx`：实时 WebGL 蓝色形体，支持指针反馈、点击变形和无 WebGL 回退。
- `components/yiyu-preview.tsx`：基于一隅项目能力制作的独立界面演示，含日常、写作与伙伴三个视图；无私人数据、后台连接或真实 AI 调用。输入仅保存在当前页面状态。
- `app/globals.css`：响应式布局与动效；尊重系统减弱动态偏好，页脚可切换并记住选择。

一隅的介绍与技术栈依据本地 `personalized-platform` 项目 README 和界面源码编写，没有复制该应用的用户数据。
