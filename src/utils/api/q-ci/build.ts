export type BuildStatus = 'pending' | 'running' | 'success' | 'failed';
export type BuildRefType = 'branch' | 'tag' | 'commit';
export type BuildStageStatus = BuildStatus | 'skipped';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type QCIBuildSourceDTO = {
  repo_url: string;
  ref_type: BuildRefType;
  ref_value: string;
  commit_id?: string | null;
  commit_msg?: string;
  author?: string;
};

type QCIArtifactDTO = {
  id: number;
  ci_config_id: number;
  business_unit_id: number;
  deploy_plan_id: number;
  name: string;
  pipeline: QCIPipelineDTO;
  image_ref: string;
  image_tag: string;
  image_digest?: string;
  status: BuildStatus;
  build_source: QCIBuildSourceDTO;
  stages?: QCIArtifactStageDTO[];
  build_started_at?: string;
  build_finished_at?: string;
  error_message?: string;
  jenkins_build_url?: string;
  jenkins_build_number?: number;
  created_at: string;
};

type QCIArtifactStageDTO = {
  name: string;
  status: BuildStageStatus;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
};

type QCIPipelineDTO = {
  name: string;
  stages: QCIPipelineStageDTO[];
};

type QCIPipelineStageDTO = {
  name: string;
  title: string;
};

type QCIArtifactListDTO = {
  list: QCIArtifactDTO[];
  total: number;
};

type QCITriggerBuildDTO = {
  artifact_id: number;
  deploy_plan_id: number;
  status: BuildStatus;
  image_ref: string;
  image_tag: string;
};

export type BuildRecord = {
  id: number;
  ciConfigID: number;
  businessUnitID: number;
  deployPlanID: number;
  name: string;
  pipeline: {
    name: string;
    stages: Array<{
      name: string;
      title: string;
    }>;
  };
  imageRef: string;
  imageTag: string;
  imageDigest: string;
  status: BuildStatus;
  buildSource: {
    repoURL: string;
    refType: BuildRefType;
    refValue: string;
    commitID: string;
    commitMessage: string;
    author: string;
  };
  stages: Array<{
    name: string;
    title: string;
    status: BuildStageStatus;
    startedAt: string;
    finishedAt: string;
    errorMessage: string;
  }>;
  buildStartedAt: string;
  buildFinishedAt: string;
  errorMessage: string;
  jenkinsBuildURL: string;
  jenkinsBuildNumber: number;
  createdAt: string;
};

export type BuildListPage = {
  items: BuildRecord[];
  total: number;
};

export type BuildListFilters = {
  businessUnitID?: number;
  deployPlanID?: number;
  page: number;
  pageSize: number;
};

export type TriggerBuildPayload = {
  deployPlanID: number;
  refType: Extract<BuildRefType, 'branch' | 'tag'>;
  refValue: string;
};

export type TriggerBuildResult = {
  artifactID: number;
  deployPlanID: number;
  status: BuildStatus;
  imageRef: string;
  imageTag: string;
};

const QCI_BASE_URL =
  (import.meta.env.VITE_Q_CI_BASE_URL as string | undefined)?.trim() ?? '/q-ci-api';
const buildListInFlight = new Map<string, Promise<BuildListPage>>();

function withBase(path: string) {
  const normalizedBase = QCI_BASE_URL.trim();
  if (!normalizedBase) {
    return path;
  }
  return `${normalizedBase.replace(/\/$/, '')}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBase(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || `request failed: ${response.status}`);
  }

  if (!body) {
    throw new Error('q-ci api failed');
  }

  if (body.code !== 0) {
    throw new Error(body.message || 'q-ci api failed');
  }

  return body.data;
}

function fromArtifact(dto: QCIArtifactDTO): BuildRecord {
  const runtimeStages = new Map((dto.stages ?? []).map((stage) => [stage.name, stage]));
  const plannedStages = dto.pipeline?.stages ?? [];

  return {
    id: dto.id,
    ciConfigID: dto.ci_config_id,
    businessUnitID: dto.business_unit_id,
    deployPlanID: dto.deploy_plan_id,
    name: dto.name,
    pipeline: {
      name: dto.pipeline?.name ?? '',
      stages: plannedStages.map((stage) => ({
        name: stage.name,
        title: stage.title,
      })),
    },
    imageRef: dto.image_ref,
    imageTag: dto.image_tag,
    imageDigest: dto.image_digest ?? '',
    status: dto.status,
    buildSource: {
      repoURL: dto.build_source.repo_url,
      refType: dto.build_source.ref_type,
      refValue: dto.build_source.ref_value,
      commitID: dto.build_source.commit_id ?? '',
      commitMessage: dto.build_source.commit_msg ?? '',
      author: dto.build_source.author ?? '',
    },
    stages: plannedStages.map((stage) => {
      const runtime = runtimeStages.get(stage.name);
      return {
        name: stage.name,
        title: stage.title,
        status: runtime?.status ?? 'pending',
        startedAt: runtime?.started_at ?? '',
        finishedAt: runtime?.finished_at ?? '',
        errorMessage: runtime?.error_message ?? '',
      };
    }),
    buildStartedAt: dto.build_started_at ?? '',
    buildFinishedAt: dto.build_finished_at ?? '',
    errorMessage: dto.error_message ?? '',
    jenkinsBuildURL: dto.jenkins_build_url ?? '',
    jenkinsBuildNumber: dto.jenkins_build_number ?? 0,
    createdAt: dto.created_at,
  };
}

export async function listBuilds(filters: BuildListFilters): Promise<BuildListPage> {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('page_size', String(filters.pageSize));
  if (filters.deployPlanID) {
    query.set('deploy_plan_id', String(filters.deployPlanID));
  } else if (filters.businessUnitID) {
    query.set('business_unit_id', String(filters.businessUnitID));
  }

  const key = query.toString();
  const inFlight = buildListInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const pending = request<QCIArtifactListDTO>(`/api/v1/artifacts?${key}`)
    .then((dto) => ({
      items: dto.list.map(fromArtifact),
      total: dto.total,
    }))
    .finally(() => {
      buildListInFlight.delete(key);
    });

  buildListInFlight.set(key, pending);
  return pending;
}

export async function triggerBuild(payload: TriggerBuildPayload): Promise<TriggerBuildResult> {
  const dto = await request<QCITriggerBuildDTO>('/api/v1/builds/trigger', {
    method: 'POST',
    body: JSON.stringify({
      deploy_plan_id: payload.deployPlanID,
      ref_type: payload.refType,
      ref_value: payload.refValue.trim(),
    }),
  });

  return {
    artifactID: dto.artifact_id,
    deployPlanID: dto.deploy_plan_id,
    status: dto.status,
    imageRef: dto.image_ref,
    imageTag: dto.image_tag,
  };
}
