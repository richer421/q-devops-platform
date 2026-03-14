# AGENTS.md for q-devops-platform

本文件是 `q-devops-platform` 子模块的 AI 开发约束（对 Codex/Agent 生效）。

## 目标

- 维护一个可持续演进的前端工程。
- 严格遵守既有技术栈版本，尤其是 Tailwind 版本。
- 通过组件化与页面化保持结构清晰。

## 技术栈与版本（必须遵守）

以下版本来自当前 `package.json`，默认不允许随意升级或降级：

| 类别 | 依赖 | 版本 |
|---|---|---|
| Runtime | Node.js | `>=22.0.0` |
| Package Manager | pnpm | `10.30.3` |
| Framework | React | `18.3.1` |
| Framework | React DOM | `18.3.1` |
| Router | react-router | `7.13.1` |
| Router | react-router-dom | `7.13.1` |
| Build | Vite | `6.3.5` |
| Build | @vitejs/plugin-react | `4.7.0` |
| Language | TypeScript | `5.8.2` |
| CSS | Tailwind CSS | `3.4.19` |
| CSS | PostCSS | `8.5.6` |
| CSS | Autoprefixer | `10.4.21` |
| Lint | ESLint | `9.22.0` |
| Lint | typescript-eslint | `8.26.1` |
| Test | Vitest | `3.0.9` |
| Format | Prettier | `3.5.3` |

### 版本策略

- 未经明确批准，不修改上述版本。
- **Tailwind CSS 必须固定为 `3.4.19`**，严禁私自升级/降级。
- 如确需升级版本，必须：
  - 在任务说明中写明升级原因与影响范围。
  - 同步更新 `package.json`、`pnpm-lock.yaml`、本文件和 `CLAUDE.md`。

## 开发硬约束

### 1) TS-only（必须）

- 所有新增代码必须使用 TypeScript：仅允许 `.ts` / `.tsx`。
- 禁止新增 `.js` / `.jsx` 业务代码。
- 保持 `tsconfig` 的 `strict: true`。

### 2) 严禁 `any`（必须）

- 禁止显式 `any`。
- 禁止通过断言链绕过类型系统（例如无理由的 `as any`）。
- 类型不明确时，优先使用 `unknown` + 类型守卫，而不是 `any`。

### 3) 组件化 + 页面化（必须）

- 页面（路由级）放在 `src/pages/*`，负责页面编排与数据装配。
- 组件放在 `src/components/*`，按业务域拆分，保证单一职责与复用性。
- 公共工具放在 `src/lib/*`，静态数据放在 `src/data/*`。
- 禁止把复杂业务逻辑直接堆在页面文件中。

### 4) 样式约束

- 优先使用 Tailwind utility class。
- 设计 token 放在 `src/styles/tokens.css`，全局样式在 `src/styles/index.css`。
- 非必要不写内联样式，不引入与现有栈冲突的样式方案。

## 交付前检查

在子模块根目录执行：

```bash
make lint
make test
make build
```

出现失败时，不得宣称任务完成。
