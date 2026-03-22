PNPM := pnpm
IMAGE ?= q-devops-platform:local

.PHONY: install dev build lint preview docker-build

install:
	$(PNPM) install

dev:
	$(PNPM) dev --host 0.0.0.0 --port 5173

build:
	$(PNPM) build

lint:
	$(PNPM) lint

preview:
	$(PNPM) preview

docker-build:
	docker build -t $(IMAGE) .
