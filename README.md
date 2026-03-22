# q-devops-platform

Q PaaS frontend devops platform rebuilt with React, Vite, and Tailwind CSS.

## Development

```bash
make install
make dev
```

## Local Ports

本地联调默认使用下面这组端口：

- 前端 Vite：`5173`
- `q-metahub`：`18080`
- `q-ci`：`18081`

前端开发代理约定：

- `/api` -> `q-metahub`
- `/q-ci-api` -> `q-ci`

如果你本地端口不同，调整以下环境变量即可：

- `VITE_DEV_SERVER_PORT`
- `VITE_METAHUB_BASE_URL`
- `VITE_METAHUB_PROXY_TARGET`
- `VITE_Q_CI_BASE_URL`
- `VITE_Q_CI_PROXY_TARGET`

参考文件：

- [.env.development.example](/Users/richer/.codex/worktrees/5624/q-paas-studio/q-devops-platform/.env.development.example)

## Quality

```bash
make lint
make build
```

## Frontend Testing

- 前端测试与页面验收默认基于 Playwright MCP 执行。
- 涉及业务流程、交互链路或真实联调时，优先使用 Playwright MCP 做真实页面验证。
- 验收完成后，应保留关键步骤、结果以及必要的截图或报告路径。
- 影响交互行为的改动，必须执行 Playwright MCP 验收后才能视为完成；`make lint` / `make build` 只能证明静态质量，不能替代页面验收。
- 建议把每次验收记录最少整理为四项：前置环境、关键步骤、验收结果、截图或报告路径。

## Docker

```bash
make docker-build
```
