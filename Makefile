PNPM := pnpm
IMAGE ?= q-devops-platform:local

.PHONY: install dev build lint test preview docker-build

install:
	$(PNPM) install

dev:
	$(PNPM) dev --host 0.0.0.0 --port 5173

build:
	$(PNPM) build

lint:
	$(PNPM) lint

test:
	$(PNPM) test

preview:
	$(PNPM) preview

docker-build:
	docker build -t $(IMAGE) .
