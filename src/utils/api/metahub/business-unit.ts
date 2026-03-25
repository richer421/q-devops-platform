type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type MetahubBusinessUnitDTO = {
  id: number;
  name: string;
  description: string;
  project_id: number;
  project?: {
    id: number;
    git_id: number;
    name: string;
    repo_url: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
};

type MetahubBusinessUnitPageDTO = {
  items: MetahubBusinessUnitDTO[];
  total: number;
  page: number;
  page_size: number;
};

export type BusinessUnitRecord = {
  id: number;
  name: string;
  description: string;
  projectId: number;
  project?: {
    id: number;
    name: string;
    repoUrl: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type BusinessUnitListFilters = {
  page: number;
  pageSize: number;
  keyword?: string;
};

export type BusinessUnitListPage = {
  items: BusinessUnitRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateBusinessUnitPayload = {
  name: string;
  description: string;
  projectId: number;
};

export type UpdateBusinessUnitPayload = {
  name: string;
  description: string;
};

const METAHUB_BASE_URL = (import.meta.env.VITE_METAHUB_BASE_URL as string | undefined)?.trim() ?? '';
const businessUnitListCache = new Map<string, BusinessUnitListPage>();
const businessUnitListInFlight = new Map<string, Promise<BusinessUnitListPage>>();

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

  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (body.code !== 0) {
    throw new Error(body.message || 'metahub api failed');
  }

  return body.data;
}

function fromDTO(dto: MetahubBusinessUnitDTO): BusinessUnitRecord {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    projectId: dto.project_id,
    project: dto.project
      ? {
          id: dto.project.id,
          name: dto.project.name,
          repoUrl: dto.project.repo_url,
        }
      : undefined,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function listKey(filters: BusinessUnitListFilters) {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('page_size', String(filters.pageSize));
  if (filters.keyword?.trim()) {
    query.set('keyword', filters.keyword.trim());
  }
  return query.toString();
}

function invalidateBusinessUnitListCache() {
  businessUnitListCache.clear();
  businessUnitListInFlight.clear();
}

export async function listBusinessUnits(filters: BusinessUnitListFilters): Promise<BusinessUnitListPage> {
  const key = listKey(filters);
  const cached = businessUnitListCache.get(key);
  if (cached) {
    return cached;
  }

  const inFlight = businessUnitListInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const pending = request<MetahubBusinessUnitPageDTO>(`/api/v1/business-units?${key}`).then((dto) => {
    const page = {
      items: dto.items.map(fromDTO),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
    businessUnitListCache.set(key, page);
    businessUnitListInFlight.delete(key);
    return page;
  }).catch((error) => {
    businessUnitListInFlight.delete(key);
    throw error;
  });

  businessUnitListInFlight.set(key, pending);
  return pending;
}

export async function createBusinessUnit(payload: CreateBusinessUnitPayload): Promise<BusinessUnitRecord> {
  const dto = await request<MetahubBusinessUnitDTO>('/api/v1/business-units', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      project_id: payload.projectId,
    }),
  });
  invalidateBusinessUnitListCache();
  return fromDTO(dto);
}

export async function updateBusinessUnit(id: number, payload: UpdateBusinessUnitPayload): Promise<BusinessUnitRecord> {
  const dto = await request<MetahubBusinessUnitDTO>(`/api/v1/business-units/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
    }),
  });
  invalidateBusinessUnitListCache();
  return fromDTO(dto);
}

export async function deleteBusinessUnit(id: number): Promise<void> {
  await request<Record<string, never>>(`/api/v1/business-units/${id}`, {
    method: 'DELETE',
  });
  invalidateBusinessUnitListCache();
}

export function __resetBusinessUnitListCacheForTest() {
  invalidateBusinessUnitListCache();
}
