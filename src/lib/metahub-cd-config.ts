import type { CDConfig } from '../mock';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type MetahubCDConfigDTO = {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  business_unit_id: number;
  release_region: string;
  release_env: string;
  deployment_mode: string;
  strategy_summary: string;
  traffic_batch_count?: number;
  traffic_ratio_list?: number[];
  manual_adjust?: boolean;
  adjust_timeout_seconds?: number;
};

type MetahubCDConfigPageDTO = {
  items: MetahubCDConfigDTO[];
  total: number;
  page: number;
  page_size: number;
};

export type CDConfigListFilters = {
  keyword?: string;
  releaseRegion?: string;
  releaseEnv?: string;
  deploymentMode?: string;
  page: number;
  pageSize: number;
};

export type CDConfigListPage = {
  items: CDConfig[];
  total: number;
  page: number;
  pageSize: number;
};

export type CDConfigFormValue = {
  name: string;
  releaseRegion: CDConfig['releaseRegion'];
  releaseEnv: CDConfig['releaseEnv'];
  deploymentMode: CDConfig['deploymentMode'];
  trafficBatchCount?: number;
  trafficRatioList?: number[];
  manualAdjust?: boolean;
  adjustTimeoutSeconds?: number;
};

type UpsertCDConfigRequest = {
  name: string;
  release_region: string;
  release_env: string;
  deployment_mode: string;
  traffic_batch_count?: number;
  traffic_ratio_list?: number[];
  manual_adjust?: boolean;
  adjust_timeout_seconds?: number;
};

const METAHUB_BASE_URL = (import.meta.env.VITE_METAHUB_BASE_URL as string | undefined)?.trim() ?? '';

const releaseRegionLabelToCode: Record<string, string> = {
  华东: 'cn-east',
  华北: 'cn-north',
  新加坡: 'ap-singapore',
};

const releaseRegionCodeToLabel: Record<string, string> = {
  'cn-east': '华东',
  'cn-north': '华北',
  'ap-singapore': '新加坡',
};

const releaseEnvLabelToCode: Record<string, string> = {
  开发: 'dev',
  测试: 'test',
  灰度: 'gray',
  生产: 'prod',
};

const releaseEnvCodeToLabel: Record<string, string> = {
  dev: '开发',
  test: '测试',
  gray: '灰度',
  prod: '生产',
};

const deploymentModeLabelToCode: Record<string, string> = {
  滚动发布: 'rolling',
  金丝雀发布: 'canary',
};

const deploymentModeCodeToLabel: Record<string, string> = {
  rolling: '滚动发布',
  canary: '金丝雀发布',
};

function normalizeReleaseRegion(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === '全部' || trimmed.toLowerCase() === 'all') {
    return undefined;
  }
  return releaseRegionLabelToCode[trimmed] ?? trimmed;
}

function normalizeReleaseEnv(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === '全部' || trimmed.toLowerCase() === 'all') {
    return undefined;
  }
  return releaseEnvLabelToCode[trimmed] ?? trimmed;
}

function normalizeDeploymentMode(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === '全部' || trimmed.toLowerCase() === 'all') {
    return undefined;
  }
  return deploymentModeLabelToCode[trimmed] ?? trimmed;
}

function withBase(path: string) {
  if (!METAHUB_BASE_URL) {
    return path;
  }
  return `${METAHUB_BASE_URL.replace(/\/$/, '')}${path}`;
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
    throw new Error('metahub api failed');
  }
  if (body.code !== 0) {
    throw new Error(body.message || 'metahub api failed');
  }

  return body.data;
}

export function cdConfigFromMetahub(dto: MetahubCDConfigDTO): CDConfig {
  return {
    id: String(dto.id),
    buId: String(dto.business_unit_id),
    name: dto.name,
    releaseRegion: (releaseRegionCodeToLabel[dto.release_region] ?? dto.release_region) as CDConfig['releaseRegion'],
    releaseEnv: (releaseEnvCodeToLabel[dto.release_env] ?? dto.release_env) as CDConfig['releaseEnv'],
    deploymentMode: (deploymentModeCodeToLabel[dto.deployment_mode] ?? dto.deployment_mode) as CDConfig['deploymentMode'],
    strategySummary: dto.strategy_summary,
    trafficBatchCount: dto.traffic_batch_count,
    trafficRatioList: dto.traffic_ratio_list,
    manualAdjust: dto.manual_adjust,
    adjustTimeoutSeconds: dto.adjust_timeout_seconds,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function cdConfigToMetahubPayload(value: CDConfigFormValue): UpsertCDConfigRequest {
  const deploymentMode = normalizeDeploymentMode(value.deploymentMode) ?? '';
  return {
    name: value.name.trim(),
    release_region: normalizeReleaseRegion(value.releaseRegion) ?? value.releaseRegion,
    release_env: normalizeReleaseEnv(value.releaseEnv) ?? value.releaseEnv,
    deployment_mode: deploymentMode || value.deploymentMode,
    traffic_batch_count: deploymentMode === 'canary' ? value.trafficBatchCount : undefined,
    traffic_ratio_list: deploymentMode === 'canary' ? value.trafficRatioList : undefined,
    manual_adjust: deploymentMode === 'canary' ? value.manualAdjust : undefined,
    adjust_timeout_seconds: deploymentMode === 'canary' ? value.adjustTimeoutSeconds : undefined,
  };
}

export async function listBusinessUnitCDConfigs(
  businessUnitID: number,
  filters: CDConfigListFilters,
): Promise<CDConfigListPage> {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('page_size', String(filters.pageSize));
  if (filters.keyword?.trim()) {
    query.set('keyword', filters.keyword.trim());
  }
  const releaseRegion = normalizeReleaseRegion(filters.releaseRegion);
  if (releaseRegion) {
    query.set('release_region', releaseRegion);
  }
  const releaseEnv = normalizeReleaseEnv(filters.releaseEnv);
  if (releaseEnv) {
    query.set('release_env', releaseEnv);
  }
  const deploymentMode = normalizeDeploymentMode(filters.deploymentMode);
  if (deploymentMode) {
    query.set('deployment_mode', deploymentMode);
  }

  const dto = await request<MetahubCDConfigPageDTO>(`/api/v1/business-units/${businessUnitID}/cd-configs?${query.toString()}`);
  return {
    items: dto.items.map(cdConfigFromMetahub),
    total: dto.total,
    page: dto.page,
    pageSize: dto.page_size,
  };
}

export async function getCDConfig(id: number): Promise<CDConfig> {
  const dto = await request<MetahubCDConfigDTO>(`/api/v1/cd-configs/${id}`);
  return cdConfigFromMetahub(dto);
}

export async function createBusinessUnitCDConfig(
  businessUnitID: number,
  value: CDConfigFormValue,
): Promise<CDConfig> {
  const dto = await request<MetahubCDConfigDTO>(`/api/v1/business-units/${businessUnitID}/cd-configs`, {
    method: 'POST',
    body: JSON.stringify(cdConfigToMetahubPayload(value)),
  });
  return cdConfigFromMetahub(dto);
}

export async function updateCDConfig(id: number, value: CDConfigFormValue): Promise<CDConfig> {
  const dto = await request<MetahubCDConfigDTO>(`/api/v1/cd-configs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cdConfigToMetahubPayload(value)),
  });
  return cdConfigFromMetahub(dto);
}

export async function deleteCDConfig(id: number): Promise<void> {
  await request<Record<string, never>>(`/api/v1/cd-configs/${id}`, {
    method: 'DELETE',
  });
}
