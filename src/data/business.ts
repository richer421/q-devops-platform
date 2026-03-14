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
  renderEngine: string;
  releaseMode: string;
  gitOpsRepo: string;
};

export type Instance = {
  id: string;
  buId: string;
  name: string;
  env: string;
  type: string;
  replicas: number;
  readyReplicas: number;
  cpu: string;
  memory: string;
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
    renderEngine: 'Helm',
    releaseMode: 'rolling',
    gitOpsRepo: 'gitops.example.io/api-server/dev',
  },
  {
    id: 'cd-002',
    buId: 'bu-001',
    name: 'cd-api-server-prod',
    renderEngine: 'Helm',
    releaseMode: 'canary',
    gitOpsRepo: 'gitops.example.io/api-server/prod',
  },
  {
    id: 'cd-003',
    buId: 'bu-002',
    name: 'cd-web-app-dev',
    renderEngine: 'Helm',
    releaseMode: 'rolling',
    gitOpsRepo: 'gitops.example.io/web-app/dev',
  },
  {
    id: 'cd-004',
    buId: 'bu-002',
    name: 'cd-web-app-prod',
    renderEngine: 'Helm',
    releaseMode: 'rolling',
    gitOpsRepo: 'gitops.example.io/web-app/prod',
  },
  {
    id: 'cd-005',
    buId: 'bu-003',
    name: 'cd-worker-prod',
    renderEngine: 'Helm',
    releaseMode: 'rolling',
    gitOpsRepo: 'gitops.example.io/worker/prod',
  },
];

export const instances: Instance[] = [
  {
    id: 'inst-001',
    buId: 'bu-001',
    name: 'inst-api-dev',
    env: 'dev',
    type: 'Deployment',
    replicas: 1,
    readyReplicas: 1,
    cpu: '250m',
    memory: '256Mi',
    status: 'running',
  },
  {
    id: 'inst-002',
    buId: 'bu-001',
    name: 'inst-api-prod',
    env: 'prod',
    type: 'Deployment',
    replicas: 2,
    readyReplicas: 2,
    cpu: '500m',
    memory: '512Mi',
    status: 'running',
  },
  {
    id: 'inst-003',
    buId: 'bu-002',
    name: 'inst-web-dev',
    env: 'dev',
    type: 'Deployment',
    replicas: 1,
    readyReplicas: 1,
    cpu: '250m',
    memory: '256Mi',
    status: 'running',
  },
  {
    id: 'inst-004',
    buId: 'bu-002',
    name: 'inst-web-prod',
    env: 'prod',
    type: 'Deployment',
    replicas: 3,
    readyReplicas: 3,
    cpu: '500m',
    memory: '512Mi',
    status: 'running',
  },
  {
    id: 'inst-005',
    buId: 'bu-003',
    name: 'inst-worker',
    env: 'prod',
    type: 'Deployment',
    replicas: 2,
    readyReplicas: 2,
    cpu: '1000m',
    memory: '1Gi',
    status: 'running',
  },
];
