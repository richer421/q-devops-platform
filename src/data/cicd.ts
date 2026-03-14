export type Build = {
  id: string;
  buId: string;
  buName: string;
  branch: string;
  commit: string;
  commitMsg: string;
  author: string;
  status: 'success' | 'failed' | 'running';
  duration: string;
  startTime: string;
  imageRef?: string;
};

export type Release = {
  id: string;
  buId: string;
  buName: string;
  version: string;
  env: string;
  artifactId: string;
  status: 'success' | 'failed' | 'deploying' | 'rolled_back';
  startTime: string;
  releaseMode: string;
};

export type BuildStep = {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  duration: string | null;
  log?: string[];
};

export type PodPhase = 'Running' | 'Terminating' | 'ContainerCreating' | 'Pending';

export type PodEntry = {
  id: string;
  name: string;
  version: 'old' | 'new';
  phase: PodPhase;
};

export type RolloutData = {
  type: 'rolling' | 'canary';
  oldVersion: string;
  newVersion: string;
  animate: boolean;
  pods: PodEntry[];
  canaryWeight?: number;
  metrics?: { p99: number; errorRate: number };
};

export type ReleaseStage = {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  duration: string | null;
  log?: string[];
  rollout?: RolloutData;
};

export const builds: Build[] = [
  {
    id: 'BUILD-005',
    buId: 'bu-001',
    buName: 'api-server',
    branch: 'feature/auth',
    commit: 'd4b73c2',
    commitMsg: 'feat: add JWT authentication middleware',
    author: 'zhangwei',
    status: 'running',
    duration: '—',
    startTime: '14:55:00',
  },
  {
    id: 'BUILD-004',
    buId: 'bu-002',
    buName: 'web-app',
    branch: 'main',
    commit: 'f2c89a1',
    commitMsg: 'chore: upgrade vite to 5.2.0',
    author: 'liuyang',
    status: 'success',
    duration: '4分30秒',
    startTime: '14:38:00',
    imageRef: 'harbor.example.io/org/web-app:main-f2c89a1',
  },
  {
    id: 'BUILD-003',
    buId: 'bu-003',
    buName: 'worker',
    branch: 'main',
    commit: 'a3f82bc',
    commitMsg: 'fix: graceful shutdown on SIGTERM',
    author: 'chenxi',
    status: 'success',
    duration: '2分15秒',
    startTime: '14:10:00',
    imageRef: 'harbor.example.io/org/worker:main-a3f82bc',
  },
  {
    id: 'BUILD-002',
    buId: 'bu-002',
    buName: 'web-app',
    branch: 'feature/nav',
    commit: 'c91de3a',
    commitMsg: 'feat: new sidebar navigation component',
    author: 'liuyang',
    status: 'failed',
    duration: '1分05秒',
    startTime: '13:45:00',
  },
  {
    id: 'BUILD-001',
    buId: 'bu-001',
    buName: 'api-server',
    branch: 'main',
    commit: 'b57ef1d',
    commitMsg: 'refactor: extract auth service layer',
    author: 'zhangwei',
    status: 'success',
    duration: '3分20秒',
    startTime: '13:20:00',
    imageRef: 'harbor.example.io/org/api-server:main-b57ef1d',
  },
];

export const releases: Release[] = [
  {
    id: 'REL-004',
    buId: 'bu-002',
    buName: 'web-app',
    version: 'v0.1.9',
    env: 'dev',
    artifactId: 'BUILD-004',
    status: 'deploying',
    startTime: '14:42:00',
    releaseMode: 'rolling',
  },
  {
    id: 'REL-003',
    buId: 'bu-001',
    buName: 'api-server',
    version: 'v0.2.1',
    env: 'dev',
    artifactId: 'BUILD-001',
    status: 'success',
    startTime: '13:35:00',
    releaseMode: 'rolling',
  },
  {
    id: 'REL-002',
    buId: 'bu-003',
    buName: 'worker',
    version: 'v0.1.5',
    env: 'prod',
    artifactId: 'BUILD-003',
    status: 'success',
    startTime: '昨天 16:10',
    releaseMode: 'rolling',
  },
  {
    id: 'REL-001',
    buId: 'bu-001',
    buName: 'api-server',
    version: 'v0.2.0',
    env: 'prod',
    artifactId: 'BUILD-001',
    status: 'success',
    startTime: '昨天 12:00',
    releaseMode: 'canary',
  },
];

export const buildSteps: Record<string, BuildStep[]> = {
  'BUILD-005': [
    { name: '代码检出', status: 'success', duration: '2s' },
    { name: '依赖安装', status: 'success', duration: '42s' },
    { name: '单元测试', status: 'success', duration: '1m 08s' },
    {
      name: '镜像构建',
      status: 'running',
      duration: null,
      log: [
        '$ docker build -t harbor.example.io/org/api-server:feature/auth-d4b73c2 .',
        'Step 1/9 : FROM node:18-alpine',
        'Step 2/9 : WORKDIR /app',
        'Step 3/9 : COPY package*.json ./',
        'Step 4/9 : RUN npm ci --only=production',
        'Step 5/9 : COPY . .',
        'Step 6/9 : RUN npm run build',
      ],
    },
    { name: '镜像推送', status: 'pending', duration: null },
  ],
  'BUILD-004': [
    { name: '代码检出', status: 'success', duration: '1s' },
    { name: '依赖安装', status: 'success', duration: '55s' },
    { name: '单元测试', status: 'success', duration: '2m 04s' },
    {
      name: '镜像构建',
      status: 'success',
      duration: '48s',
      log: [
        '$ docker build -t harbor.example.io/org/web-app:main-f2c89a1 .',
        'Step 1/9 : FROM node:18-alpine',
        'Successfully tagged harbor.example.io/org/web-app:main-f2c89a1',
      ],
    },
    {
      name: '镜像推送',
      status: 'success',
      duration: '22s',
      log: [
        '$ docker push harbor.example.io/org/web-app:main-f2c89a1',
        'digest: sha256:a1b2c3d4e5f6... size: 1847',
      ],
    },
  ],
  'BUILD-002': [
    { name: '代码检出', status: 'success', duration: '1s' },
    { name: '依赖安装', status: 'success', duration: '48s' },
    { name: '单元测试', status: 'skipped', duration: null },
    {
      name: '镜像构建',
      status: 'failed',
      duration: '16s',
      log: [
        '$ docker build -t harbor.example.io/org/web-app:feature/nav-c91de3a .',
        '✘ [ERROR] Could not resolve "@/components/NavNew"',
      ],
    },
    { name: '镜像推送', status: 'skipped', duration: null },
  ],
  'BUILD-003': [
    { name: '代码检出', status: 'success', duration: '2s' },
    { name: '依赖安装', status: 'success', duration: '30s' },
    { name: '单元测试', status: 'success', duration: '48s' },
    { name: '镜像构建', status: 'success', duration: '35s' },
    { name: '镜像推送', status: 'success', duration: '20s' },
  ],
  'BUILD-001': [
    { name: '代码检出', status: 'success', duration: '2s' },
    { name: '依赖安装', status: 'success', duration: '38s' },
    { name: '单元测试', status: 'success', duration: '1m 22s' },
    { name: '镜像构建', status: 'success', duration: '44s' },
    { name: '镜像推送', status: 'success', duration: '34s' },
  ],
};

export const releaseStages: Record<string, ReleaseStage[]> = {
  'REL-004': [
    {
      name: '预检',
      status: 'success',
      duration: '3s',
      log: [
        '$ helm diff upgrade web-app ./charts/web-app -f values.dev.yaml',
        'No breaking changes detected',
        'Pre-flight checks passed',
      ],
    },
    {
      name: '配置更新',
      status: 'success',
      duration: '5s',
      log: [
        '$ kubectl apply -f configmap.yaml -n dev',
        'configmap/web-app-config configured',
      ],
    },
    {
      name: '滚动部署',
      status: 'running',
      duration: null,
      rollout: {
        type: 'rolling',
        oldVersion: 'v0.1.8',
        newVersion: 'v0.1.9',
        animate: true,
        pods: [
          { id: '1', name: 'web-app-7d9b4c-xp2m4', version: 'old', phase: 'Terminating' },
          { id: '2', name: 'web-app-7d9b4c-qr7n1', version: 'old', phase: 'Terminating' },
          { id: '3', name: 'web-app-7d9b4c-bc3k9', version: 'old', phase: 'Running' },
          { id: '4', name: 'web-app-5f2a8e-mn4p2', version: 'new', phase: 'Running' },
          { id: '5', name: 'web-app-5f2a8e-jk7x1', version: 'new', phase: 'Running' },
          { id: '6', name: 'web-app-5f2a8e-vw9z3', version: 'new', phase: 'ContainerCreating' },
        ],
      },
    },
    {
      name: '健康验证',
      status: 'pending',
      duration: null,
    },
  ],
  'REL-003': [
    {
      name: '预检',
      status: 'success',
      duration: '2s',
      log: ['$ helm diff upgrade api-server ./charts/api-server -f values.dev.yaml'],
    },
    {
      name: '配置更新',
      status: 'success',
      duration: '4s',
      log: ['$ kubectl apply -f configmap.yaml -n dev', 'configmap/api-server-config configured'],
    },
    {
      name: '滚动部署',
      status: 'success',
      duration: '28s',
      rollout: {
        type: 'rolling',
        oldVersion: 'v0.2.0',
        newVersion: 'v0.2.1',
        animate: false,
        pods: [{ id: '1', name: 'api-server-5f2a8e-pq3r1', version: 'new', phase: 'Running' }],
      },
    },
    {
      name: '健康验证',
      status: 'success',
      duration: '8s',
      log: ['Liveness probe: healthy', 'Readiness probe: healthy', 'All health checks passed'],
    },
  ],
  'REL-002': [
    {
      name: '预检',
      status: 'success',
      duration: '2s',
      log: ['Pre-flight checks passed'],
    },
    {
      name: '配置更新',
      status: 'success',
      duration: '3s',
      log: ['$ kubectl apply -f configmap.yaml -n prod', 'configmap/worker-config configured'],
    },
    {
      name: '滚动部署',
      status: 'success',
      duration: '45s',
      rollout: {
        type: 'rolling',
        oldVersion: 'v1.3.1',
        newVersion: 'v1.3.2',
        animate: false,
        pods: [
          { id: '1', name: 'worker-5f2a8e-mn4p2', version: 'new', phase: 'Running' },
          { id: '2', name: 'worker-5f2a8e-jk7x1', version: 'new', phase: 'Running' },
        ],
      },
    },
    {
      name: '健康验证',
      status: 'success',
      duration: '6s',
      log: ['Liveness probe: healthy', 'Readiness probe: healthy'],
    },
  ],
  'REL-001': [
    {
      name: '预检',
      status: 'success',
      duration: '2s',
      log: ['Pre-flight checks passed'],
    },
    {
      name: '金丝雀 10%',
      status: 'success',
      duration: '30s',
      rollout: {
        type: 'canary',
        oldVersion: 'v0.1.9',
        newVersion: 'v0.2.0',
        animate: false,
        canaryWeight: 10,
        metrics: { p99: 42, errorRate: 0 },
        pods: [
          { id: '1', name: 'api-server-7d9b4c-xp2m4', version: 'old', phase: 'Running' },
          { id: '2', name: 'api-server-7d9b4c-qr7n1', version: 'old', phase: 'Running' },
          { id: '3', name: 'api-server-5f2a8e-mn4p2', version: 'new', phase: 'Running' },
        ],
      },
    },
    {
      name: '金丝雀 50%',
      status: 'success',
      duration: '35s',
      rollout: {
        type: 'canary',
        oldVersion: 'v0.1.9',
        newVersion: 'v0.2.0',
        animate: false,
        canaryWeight: 50,
        metrics: { p99: 45, errorRate: 0.08 },
        pods: [
          { id: '1', name: 'api-server-7d9b4c-xp2m4', version: 'old', phase: 'Running' },
          { id: '2', name: 'api-server-5f2a8e-mn4p2', version: 'new', phase: 'Running' },
          { id: '3', name: 'api-server-5f2a8e-jk7x1', version: 'new', phase: 'Running' },
        ],
      },
    },
    {
      name: '全量发布',
      status: 'success',
      duration: '52s',
      rollout: {
        type: 'rolling',
        oldVersion: 'v0.1.9',
        newVersion: 'v0.2.0',
        animate: false,
        pods: [
          { id: '1', name: 'api-server-5f2a8e-mn4p2', version: 'new', phase: 'Running' },
          { id: '2', name: 'api-server-5f2a8e-jk7x1', version: 'new', phase: 'Running' },
        ],
      },
    },
  ],
};
