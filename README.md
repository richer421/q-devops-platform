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
make test
make build
```

## Docker

```bash
make docker-build
```
