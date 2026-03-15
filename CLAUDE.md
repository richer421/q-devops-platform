# q-devops-platform 开发指南

本文件用于约束本前端模块的技术栈与开发方式。

## 技术栈（锁定）

当前项目基于以下版本开发：

- Node.js: `>=22.0.0`
- pnpm: `10.30.3`
- React / React DOM: `18.3.1`
- react-router / react-router-dom: `7.13.1`
- Ant Design: `5.29.3`
- Vite: `6.3.5`
- @vitejs/plugin-react: `4.7.0`
- TypeScript: `5.8.2`
- ESLint / typescript-eslint: `9.22.0` / `8.26.1`
- Vitest: `3.0.9`
- Prettier: `3.5.3`

## 版本管理要求

1. 默认不修改技术栈版本。
2. 如必须升级依赖，需在变更中明确原因、风险与回滚方案。
3. 涉及版本改动时，必须同步更新 `package.json`、`pnpm-lock.yaml` 以及本文档与 `AGENTS.md`。
4. Ant Design 版本变更需要明确审批，并同步更新文档。

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

- 使用 Ant Design 组件为主。
- 新功能和重构场景中，尽可能优先使用 Ant Design 官方组件与能力，并遵循 Ant Design 最佳实践。
- 禁止新增 Tailwind/Flowbite 依赖与用法。
- 禁止在 TSX 中使用 `className`，样式通过 Antd + `style` 完成。
- 禁止新增自定义 CSS 文件。

## 质量门禁

每次提交前在模块目录执行：

```bash
make lint
make test
make build
```

任一命令失败，则该变更不应提交。
