# q-devops-platform 开发指南

本文件用于约束本前端模块的技术栈与开发方式。

## 技术栈（锁定）

当前项目基于以下版本开发：

- Node.js: `>=22.0.0`
- pnpm: `10.30.3`
- React / React DOM: `18.3.1`
- react-router / react-router-dom: `7.13.1`
- Vite: `6.3.5`
- @vitejs/plugin-react: `4.7.0`
- TypeScript: `5.8.2`
- Tailwind CSS: `3.4.19`（重点：严格遵守）
- PostCSS / Autoprefixer: `8.5.6` / `10.4.21`
- ESLint / typescript-eslint: `9.22.0` / `8.26.1`
- Vitest: `3.0.9`
- Prettier: `3.5.3`

## 版本管理要求

1. 默认不修改技术栈版本。
2. 如必须升级依赖，需在变更中明确原因、风险与回滚方案。
3. 涉及版本改动时，必须同步更新 `package.json`、`pnpm-lock.yaml` 以及本文档与 `AGENTS.md`。
4. **Tailwind CSS 版本必须保持 `3.4.19`，除非有明确审批。**

## 开发要求

### 1. 组件化与页面化

- 页面层：`src/pages/*`，负责路由页面、数据组装、页面级状态。
- 组件层：`src/components/*`，负责可复用 UI 与业务组件。
- 工具层：`src/lib/*`，放通用函数与类型相关工具。
- 数据层：`src/data/*`，放 mock 或静态结构化数据。

要求：页面只做编排，不堆积可复用逻辑；可复用逻辑应下沉为组件或工具。

### 2. TypeScript 强制

- 新增与修改代码必须是 TypeScript（`.ts` / `.tsx`）。
- 禁止提交 `.js` / `.jsx` 业务代码。
- 维持严格类型模式（`strict: true`）。

### 3. 严禁 `any`

- 禁止显式 `any` 与 `as any`。
- 遇到不确定类型，使用 `unknown`、联合类型、泛型、类型守卫解决。

### 4. 样式规范

- 使用 Tailwind 为主。
- 公共样式与变量分别维护在 `src/styles/index.css` 与 `src/styles/tokens.css`。

## 质量门禁

每次提交前在模块目录执行：

```bash
make lint
make test
make build
```

任一命令失败，则该变更不应提交。
