import type { DeployPlan } from '@/mock';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type MetahubDeployPlanDTO = {
  id: number;
  business_unit_id: number;
  name: string;
  description?: string;
  ci_config_id?: number;
  cd_config_id?: number;
  instance_oam_id?: number;
  env: string;
  ci_config_name: string;
  cd_config_name: string;
  instance_name: string;
  last_status: string;
  last_time: string;
  created_at?: string;
  updated_at?: string;
};

type MetahubDeployPlanPageDTO = {
  items: MetahubDeployPlanDTO[];
  total: number;
  page: number;
  page_size: number;
};

export type DeployPlanListFilters = {
  page: number;
  pageSize: number;
  keyword?: string;
};

export type DeployPlanListPage = {
  items: DeployPlan[];
  total: number;
  page: number;
  pageSize: number;
};

export type DeployPlanFormValue = {
  name: string;
  description: string;
  ciConfigID?: number;
  cdConfigID?: number;
  instanceOAMID?: number;
};

type UpsertDeployPlanRequest = {
  name: string;
  description: string;
  ci_config_id: number;
  cd_config_id: number;
  instance_oam_id: number;
};

const METAHUB_BASE_URL = (import.meta.env.VITE_METAHUB_BASE_URL as string | undefined)?.trim() ?? '';
const deployPlanListInFlight = new Map<string, Promise<DeployPlanListPage>>();

function withBase(path: string) {
  if (!METAHUB_BASE_URL) {
    return path;
  }
  return `${METAHUB_BASE_URL.replace(/\/$/, '')}${path}`;
}

function normalizeDeployPlanStatus(status: string): DeployPlan['lastStatus'] {
  if (status === 'success' || status === 'failed' || status === 'running' || status === 'pending') {
    return status;
  }
  return 'pending';
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

export function deployPlanFromMetahub(dto: MetahubDeployPlanDTO): DeployPlan {
  return {
    id: String(dto.id),
    buId: String(dto.business_unit_id),
    name: dto.name,
    description: dto.description ?? '',
    ciConfigID: dto.ci_config_id,
    cdConfigID: dto.cd_config_id,
    instanceOAMID: dto.instance_oam_id,
    env: dto.env || '-',
    ciConfig: dto.ci_config_name || '-',
    cdConfig: dto.cd_config_name || '-',
    instance: dto.instance_name || '-',
    lastStatus: normalizeDeployPlanStatus(dto.last_status),
    lastTime: dto.last_time || '-',
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function deployPlanToFormValue(item: DeployPlan): DeployPlanFormValue {
  return {
    name: item.name,
    description: item.description ?? '',
    ciConfigID: item.ciConfigID,
    cdConfigID: item.cdConfigID,
    instanceOAMID: item.instanceOAMID,
  };
}

function deployPlanToPayload(value: DeployPlanFormValue): UpsertDeployPlanRequest {
  return {
    name: value.name.trim(),
    description: value.description.trim(),
    ci_config_id: value.ciConfigID ?? 0,
    cd_config_id: value.cdConfigID ?? 0,
    instance_oam_id: value.instanceOAMID ?? 0,
  };
}

export async function listBusinessUnitDeployPlans(
  businessUnitID: number,
  filters: DeployPlanListFilters,
): Promise<DeployPlanListPage> {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('page_size', String(filters.pageSize));
  if (filters.keyword?.trim()) {
    query.set('keyword', filters.keyword.trim());
  }

  const key = `${businessUnitID}:${query.toString()}`;
  const inFlight = deployPlanListInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const pending = request<MetahubDeployPlanPageDTO>(`/api/v1/business-units/${businessUnitID}/deploy-plans?${query.toString()}`)
    .then((dto) => ({
      items: dto.items.map(deployPlanFromMetahub),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    }))
    .finally(() => {
      deployPlanListInFlight.delete(key);
    });

  deployPlanListInFlight.set(key, pending);
  return pending;
}

export async function getDeployPlan(deployPlanID: number): Promise<DeployPlan> {
  const dto = await request<MetahubDeployPlanDTO>(`/api/v1/deploy-plans/${deployPlanID}`);
  return deployPlanFromMetahub(dto);
}

export async function createBusinessUnitDeployPlan(
  businessUnitID: number,
  value: DeployPlanFormValue,
): Promise<DeployPlan> {
  const dto = await request<MetahubDeployPlanDTO>(`/api/v1/business-units/${businessUnitID}/deploy-plans`, {
    method: 'POST',
    body: JSON.stringify(deployPlanToPayload(value)),
  });
  return deployPlanFromMetahub(dto);
}

export async function updateDeployPlan(deployPlanID: number, value: DeployPlanFormValue): Promise<DeployPlan> {
  const dto = await request<MetahubDeployPlanDTO>(`/api/v1/deploy-plans/${deployPlanID}`, {
    method: 'PUT',
    body: JSON.stringify(deployPlanToPayload(value)),
  });
  return deployPlanFromMetahub(dto);
}

export async function deleteDeployPlan(deployPlanID: number): Promise<void> {
  await request<Record<string, never>>(`/api/v1/deploy-plans/${deployPlanID}`, {
    method: 'DELETE',
  });
}
