export type BusinessUnit = {
  id: string;
  name: string;
  desc: string;
  repoUrl: string;
  status: 'active' | 'inactive';
};

export type DeployPlan = {
  id: string;
  buId: string;
  name: string;
  env: string;
  ciConfig: string;
  cdConfig: string;
  instance: string;
  lastStatus: 'success' | 'failed' | 'running' | 'pending';
  lastTime: string;
};

export type CIConfig = {
  id: string;
  buId: string;
  name: string;
  registry: string;
  repo: string;
  tagRule: string;
  buildType: 'dockerfile' | 'makefile';
};

export type CDConfig = {
  id: string;
  buId: string;
  name: string;
  releaseRegion: '华东' | '华北' | '新加坡';
  releaseEnv: '开发' | '测试' | '灰度' | '生产';
  deploymentMode: '滚动发布' | '金丝雀发布';
  strategySummary: string;
  trafficBatchCount?: number;
  trafficRatioList?: number[];
  manualAdjust?: boolean;
  adjustTimeoutSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InstanceEnvVar = {
  name: string;
  value: string;
};

export type InstanceContainerPort = {
  containerPort: number;
};

export type InstanceResourceValues = {
  cpu?: string;
  memory?: string;
};

export type InstanceContainerResources = {
  requests?: InstanceResourceValues;
  limits?: InstanceResourceValues;
};

export type InstanceContainerSpec = {
  name: string;
  image: string;
  ports?: InstanceContainerPort[];
  env?: InstanceEnvVar[];
  resources?: InstanceContainerResources;
};

export type DeploymentInstanceSpec = {
  replicas?: number;
  template?: {
    spec?: {
      containers?: InstanceContainerSpec[];
    };
  };
};

export type InstanceSpecDocument = {
  deployment?: DeploymentInstanceSpec;
  statefulSet?: Record<string, unknown>;
  job?: Record<string, unknown>;
  cronJob?: Record<string, unknown>;
  pod?: Record<string, unknown>;
};

export type InstanceAttachResource = {
  metadata?: {
    name?: string;
  };
  spec?: {
    ports?: Array<{
      port: number;
      targetPort: number;
    }>;
  };
};

export type InstanceAttachResources = {
  configMaps?: Record<string, InstanceAttachResource>;
  secrets?: Record<string, InstanceAttachResource>;
  services?: Record<string, InstanceAttachResource>;
};

export type InstancePodContainer = {
  name: string;
  image: string;
  status: 'running' | 'waiting' | 'terminated';
  ready: boolean;
  restartCount: number;
  cpuLimit?: string;
  memoryLimit?: string;
  branch?: string;
  commit?: string;
};

export type InstancePod = {
  name: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Succeeded' | 'Failed';
  age: string;
  node: string;
  nodeIP?: string;
  podIP: string;
  containers: InstancePodContainer[];
  events: string[];
  logs: string;
  yaml: string;
};

export type Instance = {
  id: string;
  buId: string;
  name: string;
  env: string;
  type: string;
  instanceType?: 'deployment' | 'statefulset' | 'job' | 'cronjob' | 'pod';
  replicas: number;
  readyReplicas: number;
  cpu: string;
  memory: string;
  yaml?: string;
  spec?: InstanceSpecDocument;
  attachResources?: InstanceAttachResources;
  pods?: InstancePod[];
  status: 'running' | 'degraded' | 'stopped';
};

export const businesses: BusinessUnit[] = [
  {
    id: 'bu-001',
    name: 'api-server',
    desc: '核心 REST API 服务',
    repoUrl: 'https://github.com/org/api-server',
    status: 'active',
  },
  {
    id: 'bu-002',
    name: 'web-app',
    desc: '前端 Web 单页应用',
    repoUrl: 'https://github.com/org/web-app',
    status: 'active',
  },
  {
    id: 'bu-003',
    name: 'worker',
    desc: '后台异步任务处理服务',
    repoUrl: 'https://github.com/org/worker',
    status: 'active',
  },
];

export const deployPlans: DeployPlan[] = [
  {
    id: 'dp-001',
    buId: 'bu-001',
    name: 'api-server-dev',
    env: 'dev',
    ciConfig: 'ci-api-server',
    cdConfig: 'cd-api-server-dev',
    instance: 'inst-api-dev',
    lastStatus: 'success',
    lastTime: '2小时前',
  },
  {
    id: 'dp-002',
    buId: 'bu-001',
    name: 'api-server-prod',
    env: 'prod',
    ciConfig: 'ci-api-server',
    cdConfig: 'cd-api-server-prod',
    instance: 'inst-api-prod',
    lastStatus: 'success',
    lastTime: '1天前',
  },
  {
    id: 'dp-003',
    buId: 'bu-002',
    name: 'web-app-dev',
    env: 'dev',
    ciConfig: 'ci-web-app',
    cdConfig: 'cd-web-app-dev',
    instance: 'inst-web-dev',
    lastStatus: 'running',
    lastTime: '5分钟前',
  },
  {
    id: 'dp-004',
    buId: 'bu-002',
    name: 'web-app-prod',
    env: 'prod',
    ciConfig: 'ci-web-app',
    cdConfig: 'cd-web-app-prod',
    instance: 'inst-web-prod',
    lastStatus: 'success',
    lastTime: '3小时前',
  },
  {
    id: 'dp-005',
    buId: 'bu-003',
    name: 'worker-prod',
    env: 'prod',
    ciConfig: 'ci-worker',
    cdConfig: 'cd-worker-prod',
    instance: 'inst-worker',
    lastStatus: 'success',
    lastTime: '5小时前',
  },
];

export const ciConfigs: CIConfig[] = [
  {
    id: 'ci-001',
    buId: 'bu-001',
    name: 'ci-api-server',
    registry: 'harbor.example.io',
    repo: 'org/api-server',
    tagRule: '${branch}-${commit:7}',
    buildType: 'dockerfile',
  },
  {
    id: 'ci-002',
    buId: 'bu-002',
    name: 'ci-web-app',
    registry: 'harbor.example.io',
    repo: 'org/web-app',
    tagRule: '${branch}-${commit:7}',
    buildType: 'dockerfile',
  },
  {
    id: 'ci-003',
    buId: 'bu-003',
    name: 'ci-worker',
    registry: 'harbor.example.io',
    repo: 'org/worker',
    tagRule: '${tag}',
    buildType: 'makefile',
  },
];

export const cdConfigs: CDConfig[] = [
  {
    id: 'cd-001',
    buId: 'bu-001',
    name: 'cd-api-server-dev',
    releaseRegion: '华东',
    releaseEnv: '开发',
    deploymentMode: '滚动发布',
    strategySummary: '滚动发布（默认策略）',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-15T09:30:00Z',
  },
  {
    id: 'cd-002',
    buId: 'bu-001',
    name: 'cd-api-server-prod',
    releaseRegion: '华北',
    releaseEnv: '生产',
    deploymentMode: '金丝雀发布',
    strategySummary: '3 批次 / 10%,30%,60%',
    trafficBatchCount: 3,
    trafficRatioList: [10, 30, 60],
    manualAdjust: true,
    adjustTimeoutSeconds: 300,
    createdAt: '2026-03-11T11:00:00Z',
    updatedAt: '2026-03-16T11:20:00Z',
  },
  {
    id: 'cd-003',
    buId: 'bu-002',
    name: 'cd-web-app-dev',
    releaseRegion: '华东',
    releaseEnv: '开发',
    deploymentMode: '滚动发布',
    strategySummary: '滚动发布（默认策略）',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-16T08:40:00Z',
  },
  {
    id: 'cd-004',
    buId: 'bu-002',
    name: 'cd-web-app-prod',
    releaseRegion: '新加坡',
    releaseEnv: '生产',
    deploymentMode: '滚动发布',
    strategySummary: '滚动发布（默认策略）',
    createdAt: '2026-03-12T11:20:00Z',
    updatedAt: '2026-03-17T10:10:00Z',
  },
  {
    id: 'cd-005',
    buId: 'bu-003',
    name: 'cd-worker-prod',
    releaseRegion: '华北',
    releaseEnv: '生产',
    deploymentMode: '滚动发布',
    strategySummary: '滚动发布（默认策略）',
    createdAt: '2026-03-13T08:00:00Z',
    updatedAt: '2026-03-17T09:15:00Z',
  },
];

export const businessInstanceConfigs: Instance[] = [
  {
    id: 'inst-001',
    buId: 'bu-001',
    name: 'inst-api-dev',
    env: 'dev',
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 2,
    readyReplicas: 2,
    cpu: '250m',
    memory: '256Mi',
    yaml: `name: inst-api-dev
env: dev
instance_type: deployment
spec:
  deployment:
    replicas: 2
    template:
      spec:
        containers:
          - name: api-server
            image: harbor.example.io/org/api-server:1.4.2
            ports:
              - containerPort: 8080
            env:
              - name: APP_ENV
                value: dev
              - name: LOG_LEVEL
                value: debug
            resources:
              requests:
                cpu: 250m
                memory: 256Mi
              limits:
                cpu: 500m
                memory: 512Mi
attach_resources:
  configMaps:
    api-server-config:
      metadata:
        name: api-server-config
  secrets:
    api-server-secret:
      metadata:
        name: api-server-secret
  services:
    api-server:
      metadata:
        name: api-server`,
    spec: {
      deployment: {
        replicas: 2,
        template: {
          spec: {
            containers: [
              {
                name: 'api-server',
                image: 'harbor.example.io/org/api-server:1.4.2',
                ports: [{ containerPort: 8080 }],
                env: [
                  { name: 'APP_ENV', value: 'dev' },
                  { name: 'LOG_LEVEL', value: 'debug' },
                ],
                resources: {
                  requests: { cpu: '250m', memory: '256Mi' },
                  limits: { cpu: '500m', memory: '512Mi' },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      configMaps: {
        'api-server-config': {
          metadata: { name: 'api-server-config' },
        },
      },
      secrets: {
        'api-server-secret': {
          metadata: { name: 'api-server-secret' },
        },
      },
      services: {
        'api-server': {
          metadata: { name: 'api-server' },
          spec: { ports: [{ port: 80, targetPort: 8080 }] },
        },
      },
    },
    pods: [
      {
        name: 'api-server-dev-6f9d4d4b7f-km2p8',
        status: 'Running',
        age: '8m',
        node: 'node-dev-02',
        nodeIP: '172.16.10.12',
        podIP: '10.0.12.18',
        containers: [
          {
            name: 'api-server',
            image: 'harbor.example.io/org/api-server:1.4.2',
            branch: 'develop',
            commit: '9f3a2c1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'istio-proxy',
            image: 'docker.io/istio/proxyv2:1.22.1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: [
          'Normal Scheduled Successfully assigned api-server-dev-6f9d4d4b7f-km2p8 to node-dev-02',
          'Normal Pulled Container image "harbor.example.io/org/api-server:1.4.2" already present on machine',
          'Normal Started Started container api-server',
          'Normal Started Started container istio-proxy',
        ],
        logs: `2026-03-15T10:21:14Z Started HTTP server on :8080
2026-03-15T10:21:16Z Health check ready
2026-03-15T10:21:21Z GET /api/v1/health 200 1.2ms`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: api-server-dev-6f9d4d4b7f-km2p8
spec:
  containers:
    - name: api-server
      image: harbor.example.io/org/api-server:1.4.2
    - name: istio-proxy
      image: docker.io/istio/proxyv2:1.22.1`,
      },
      {
        name: 'api-server-dev-6f9d4d4b7f-p7m4n',
        status: 'Running',
        age: '7m',
        node: 'node-dev-03',
        nodeIP: '172.16.10.13',
        podIP: '10.0.12.19',
        containers: [
          {
            name: 'api-server',
            image: 'harbor.example.io/org/api-server:1.4.2',
            branch: 'develop',
            commit: '9f3a2c1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'istio-proxy',
            image: 'docker.io/istio/proxyv2:1.22.1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: [
          'Normal Scheduled Successfully assigned api-server-dev-6f9d4d4b7f-p7m4n to node-dev-03',
          'Normal Started Started container api-server',
          'Normal Started Started container istio-proxy',
        ],
        logs: `2026-03-15T10:22:14Z Started HTTP server on :8080
2026-03-15T10:22:19Z Connected to upstream redis
2026-03-15T10:22:29Z GET /api/v1/config 200 3.8ms`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: api-server-dev-6f9d4d4b7f-p7m4n
spec:
  containers:
    - name: api-server
      image: harbor.example.io/org/api-server:1.4.2
    - name: istio-proxy
      image: docker.io/istio/proxyv2:1.22.1`,
      },
    ],
    status: 'running',
  },
  {
    id: 'inst-002',
    buId: 'bu-001',
    name: 'inst-api-prod',
    env: 'prod',
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 2,
    readyReplicas: 2,
    cpu: '500m',
    memory: '512Mi',
    yaml: `name: inst-api-prod
env: prod
instance_type: deployment
spec:
  deployment:
    replicas: 2
    template:
      spec:
        containers:
          - name: api-server
            image: harbor.example.io/org/api-server:1.4.1
            ports:
              - containerPort: 8080
            env:
              - name: APP_ENV
                value: prod
              - name: LOG_LEVEL
                value: info
            resources:
              requests:
                cpu: 500m
                memory: 512Mi
              limits:
                cpu: 1000m
                memory: 1Gi
attach_resources:
  configMaps:
    api-server-config-prod:
      metadata:
        name: api-server-config-prod
  services:
    api-server-prod:
      metadata:
        name: api-server-prod`,
    spec: {
      deployment: {
        replicas: 2,
        template: {
          spec: {
            containers: [
              {
                name: 'api-server',
                image: 'harbor.example.io/org/api-server:1.4.1',
                ports: [{ containerPort: 8080 }],
                env: [
                  { name: 'APP_ENV', value: 'prod' },
                  { name: 'LOG_LEVEL', value: 'info' },
                ],
                resources: {
                  requests: { cpu: '500m', memory: '512Mi' },
                  limits: { cpu: '1000m', memory: '1Gi' },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      configMaps: {
        'api-server-config-prod': {
          metadata: { name: 'api-server-config-prod' },
        },
      },
      services: {
        'api-server-prod': {
          metadata: { name: 'api-server-prod' },
          spec: { ports: [{ port: 80, targetPort: 8080 }] },
        },
      },
    },
    pods: [
      {
        name: 'api-server-prod-7c68d4d6df-9x2pl',
        status: 'Running',
        age: '1d',
        node: 'node-prod-04',
        nodeIP: '172.16.20.24',
        podIP: '10.0.20.44',
        containers: [
          {
            name: 'api-server',
            image: 'harbor.example.io/org/api-server:1.4.1',
            branch: 'main',
            commit: 'a81f4d9',
            status: 'running',
            ready: true,
            restartCount: 1,
          },
          {
            name: 'istio-proxy',
            image: 'docker.io/istio/proxyv2:1.22.1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: [
          'Normal Scheduled Successfully assigned api-server-prod-7c68d4d6df-9x2pl to node-prod-04',
          'Normal Started Started container api-server',
          'Normal Started Started container istio-proxy',
        ],
        logs: `2026-03-14T22:03:11Z Started HTTP server on :8080
2026-03-14T22:05:03Z Warmed route cache`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: api-server-prod-7c68d4d6df-9x2pl
spec:
  containers:
    - name: api-server
      image: harbor.example.io/org/api-server:1.4.1
    - name: istio-proxy
      image: docker.io/istio/proxyv2:1.22.1`,
      },
      {
        name: 'api-server-prod-7c68d4d6df-q8n5r',
        status: 'Running',
        age: '1d',
        node: 'node-prod-05',
        nodeIP: '172.16.20.25',
        podIP: '10.0.20.45',
        containers: [
          {
            name: 'api-server',
            image: 'harbor.example.io/org/api-server:1.4.1',
            branch: 'main',
            commit: 'a81f4d9',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'istio-proxy',
            image: 'docker.io/istio/proxyv2:1.22.1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: [
          'Normal Scheduled Successfully assigned api-server-prod-7c68d4d6df-q8n5r to node-prod-05',
          'Normal Started Started container api-server',
          'Normal Started Started container istio-proxy',
        ],
        logs: `2026-03-14T22:04:12Z Started HTTP server on :8080
2026-03-14T22:06:08Z Warmed route cache
2026-03-14T22:07:44Z GET /api/v1/metrics 200 2.1ms`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: api-server-prod-7c68d4d6df-q8n5r
spec:
  containers:
    - name: api-server
      image: harbor.example.io/org/api-server:1.4.1
    - name: istio-proxy
      image: docker.io/istio/proxyv2:1.22.1`,
      },
    ],
    status: 'running',
  },
  {
    id: 'inst-003',
    buId: 'bu-002',
    name: 'inst-web-dev',
    env: 'dev',
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 1,
    readyReplicas: 1,
    cpu: '250m',
    memory: '256Mi',
    yaml: `name: inst-web-dev
env: dev
instance_type: deployment
spec:
  deployment:
    replicas: 1
attach_resources:
  services:
    web-app:
      metadata:
        name: web-app`,
    spec: {
      deployment: {
        replicas: 1,
        template: {
          spec: {
            containers: [
              {
                name: 'web-app',
                image: 'harbor.example.io/org/web-app:0.9.4',
                ports: [{ containerPort: 3000 }],
                env: [{ name: 'APP_ENV', value: 'dev' }],
                resources: {
                  requests: { cpu: '250m', memory: '256Mi' },
                  limits: { cpu: '500m', memory: '512Mi' },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      services: {
        'web-app': {
          metadata: { name: 'web-app' },
        },
      },
    },
    pods: [
      {
        name: 'web-app-dev-74bb9ddcb4-ks8wd',
        status: 'Running',
        age: '5m',
        node: 'node-dev-03',
        nodeIP: '172.16.10.13',
        podIP: '10.0.12.33',
        containers: [
          {
            name: 'web-app',
            image: 'harbor.example.io/org/web-app:0.9.4',
            branch: 'develop',
            commit: '4c7d2e1',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'nginx-sidecar',
            image: 'nginx:1.27-alpine',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container web-app', 'Normal Started Started container nginx-sidecar'],
        logs: `2026-03-15T10:24:01Z frontend ready
2026-03-15T10:24:08Z serving static assets from /usr/share/nginx/html`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: web-app-dev-74bb9ddcb4-ks8wd
spec:
  containers:
    - name: web-app
      image: harbor.example.io/org/web-app:0.9.4
    - name: nginx-sidecar
      image: nginx:1.27-alpine`,
      },
    ],
    status: 'running',
  },
  {
    id: 'inst-004',
    buId: 'bu-002',
    name: 'inst-web-prod',
    env: 'prod',
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 3,
    readyReplicas: 3,
    cpu: '500m',
    memory: '512Mi',
    yaml: `name: inst-web-prod
env: prod
instance_type: deployment
spec:
  deployment:
    replicas: 3
attach_resources:
  services:
    web-app-prod:
      metadata:
        name: web-app-prod`,
    spec: {
      deployment: {
        replicas: 3,
        template: {
          spec: {
            containers: [
              {
                name: 'web-app',
                image: 'harbor.example.io/org/web-app:0.9.3',
                ports: [{ containerPort: 3000 }],
                env: [{ name: 'APP_ENV', value: 'prod' }],
                resources: {
                  requests: { cpu: '500m', memory: '512Mi' },
                  limits: { cpu: '1000m', memory: '1Gi' },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      services: {
        'web-app-prod': {
          metadata: { name: 'web-app-prod' },
        },
      },
    },
    pods: [
      {
        name: 'web-app-prod-7cb57fb5d6-k2pmq',
        status: 'Running',
        age: '3h',
        node: 'node-prod-02',
        nodeIP: '172.16.20.22',
        podIP: '10.0.20.31',
        containers: [
          {
            name: 'web-app',
            image: 'harbor.example.io/org/web-app:0.9.3',
            branch: 'release/2026.03',
            commit: 'd29b7aa',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'nginx-sidecar',
            image: 'nginx:1.27-alpine',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container web-app', 'Normal Started Started container nginx-sidecar'],
        logs: `2026-03-15T07:14:21Z frontend ready
2026-03-15T07:14:28Z cache primed`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: web-app-prod-7cb57fb5d6-k2pmq
spec:
  containers:
    - name: web-app
      image: harbor.example.io/org/web-app:0.9.3
    - name: nginx-sidecar
      image: nginx:1.27-alpine`,
      },
      {
        name: 'web-app-prod-7cb57fb5d6-f5m2x',
        status: 'Running',
        age: '3h',
        node: 'node-prod-03',
        nodeIP: '172.16.20.23',
        podIP: '10.0.20.32',
        containers: [
          {
            name: 'web-app',
            image: 'harbor.example.io/org/web-app:0.9.3',
            branch: 'release/2026.03',
            commit: 'd29b7aa',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'nginx-sidecar',
            image: 'nginx:1.27-alpine',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container web-app', 'Normal Started Started container nginx-sidecar'],
        logs: `2026-03-15T07:13:58Z frontend ready
2026-03-15T07:14:05Z cache primed`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: web-app-prod-7cb57fb5d6-f5m2x
spec:
  containers:
    - name: web-app
      image: harbor.example.io/org/web-app:0.9.3
    - name: nginx-sidecar
      image: nginx:1.27-alpine`,
      },
      {
        name: 'web-app-prod-7cb57fb5d6-r4j8c',
        status: 'Running',
        age: '3h',
        node: 'node-prod-06',
        nodeIP: '172.16.20.26',
        podIP: '10.0.20.33',
        containers: [
          {
            name: 'web-app',
            image: 'harbor.example.io/org/web-app:0.9.3',
            branch: 'release/2026.03',
            commit: 'd29b7aa',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'nginx-sidecar',
            image: 'nginx:1.27-alpine',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container web-app', 'Normal Started Started container nginx-sidecar'],
        logs: `2026-03-15T07:14:11Z frontend ready
2026-03-15T07:14:17Z cache primed`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: web-app-prod-7cb57fb5d6-r4j8c
spec:
  containers:
    - name: web-app
      image: harbor.example.io/org/web-app:0.9.3
    - name: nginx-sidecar
      image: nginx:1.27-alpine`,
      },
    ],
    status: 'running',
  },
  {
    id: 'inst-005',
    buId: 'bu-003',
    name: 'inst-worker',
    env: 'prod',
    type: 'Deployment',
    instanceType: 'deployment',
    replicas: 2,
    readyReplicas: 2,
    cpu: '1000m',
    memory: '1Gi',
    yaml: `name: inst-worker
env: prod
instance_type: deployment
spec:
  deployment:
    replicas: 2
attach_resources:
  configMaps:
    worker-config:
      metadata:
        name: worker-config`,
    spec: {
      deployment: {
        replicas: 2,
        template: {
          spec: {
            containers: [
              {
                name: 'worker',
                image: 'harbor.example.io/org/worker:2.1.0',
                env: [{ name: 'APP_ENV', value: 'prod' }],
                resources: {
                  requests: { cpu: '1000m', memory: '1Gi' },
                  limits: { cpu: '2000m', memory: '2Gi' },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      configMaps: {
        'worker-config': {
          metadata: { name: 'worker-config' },
        },
      },
    },
    pods: [
      {
        name: 'worker-prod-84b8dd6b64-v9rkp',
        status: 'Running',
        age: '5h',
        node: 'node-prod-05',
        nodeIP: '172.16.20.25',
        podIP: '10.0.21.17',
        containers: [
          {
            name: 'worker',
            image: 'harbor.example.io/org/worker:2.1.0',
            branch: 'main',
            commit: '7bc3f20',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
          {
            name: 'log-agent',
            image: 'fluent/fluent-bit:3.0.7',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container worker', 'Normal Started Started container log-agent'],
        logs: `2026-03-15T05:01:18Z worker running
2026-03-15T05:01:26Z subscribed queue billing.reconcile`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: worker-prod-84b8dd6b64-v9rkp
spec:
  containers:
    - name: worker
      image: harbor.example.io/org/worker:2.1.0
    - name: log-agent
      image: fluent/fluent-bit:3.0.7`,
      },
      {
        name: 'worker-prod-84b8dd6b64-z2x6m',
        status: 'Running',
        age: '5h',
        node: 'node-prod-06',
        nodeIP: '172.16.20.26',
        podIP: '10.0.21.18',
        containers: [
          {
            name: 'worker',
            image: 'harbor.example.io/org/worker:2.1.0',
            branch: 'main',
            commit: '7bc3f20',
            status: 'running',
            ready: true,
            restartCount: 1,
          },
          {
            name: 'log-agent',
            image: 'fluent/fluent-bit:3.0.7',
            status: 'running',
            ready: true,
            restartCount: 0,
          },
        ],
        events: ['Normal Started Started container worker', 'Normal Started Started container log-agent'],
        logs: `2026-03-15T05:03:09Z worker running
2026-03-15T05:03:22Z subscribed queue media.transcode`,
        yaml: `apiVersion: v1
kind: Pod
metadata:
  name: worker-prod-84b8dd6b64-z2x6m
spec:
  containers:
    - name: worker
      image: harbor.example.io/org/worker:2.1.0
    - name: log-agent
      image: fluent/fluent-bit:3.0.7`,
      },
    ],
    status: 'running',
  },
];

export const instances = businessInstanceConfigs;
