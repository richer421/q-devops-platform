type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type CIConfigImageTagRuleDTO = {
  type: 'branch' | 'tag' | 'commit' | 'timestamp' | 'custom';
  template?: string;
  with_timestamp?: boolean;
  with_commit?: boolean;
};

type CIConfigBuildSpecDTO = {
  makefile_path?: string;
  make_command?: string;
  dockerfile_path?: string;
  docker_context?: string;
};

type MetahubCIConfigDTO = {
  id: number;
  business_unit_id: number;
  name: string;
  image_registry: string;
  image_repo: string;
  full_image_repo: string;
  image_tag_rule: CIConfigImageTagRuleDTO;
  build_spec: CIConfigBuildSpecDTO;
  deploy_plan_ref_count?: number;
  created_at: string;
  updated_at: string;
};

type MetahubCIConfigPageDTO = {
  items: MetahubCIConfigDTO[];
  total: number;
  page: number;
  page_size: number;
};

type CreateCIConfigRequest = {
  name: string;
  image_registry: string;
  image_tag_rule: CIConfigImageTagRuleDTO;
  build_spec: {
    makefile_path: string;
    make_command: string;
    dockerfile_path: string;
  };
};

type UpdateCIConfigRequest = {
  name: string;
  image_registry: string;
  image_tag_rule: CIConfigImageTagRuleDTO;
  build_spec: {
    makefile_path: string;
    make_command: string;
    dockerfile_path: string;
  };
};

export type CIConfigTagRuleType = CIConfigImageTagRuleDTO['type'];

export type CIConfigTagRule = {
  type: CIConfigTagRuleType;
  template: string;
  withTimestamp: boolean;
  withCommit: boolean;
};

export type CIConfigBuildSpec = {
  makefilePath: string;
  makeCommand: string;
  dockerfilePath: string;
  dockerContext: string;
};

export type CIConfigItem = {
  id: number;
  businessUnitID: number;
  name: string;
  imageRegistry: string;
  imageRepo: string;
  fullImageRepo: string;
  imageTagRule: CIConfigTagRule;
  tagRuleLabel: string;
  buildSpec: CIConfigBuildSpec;
  deployPlanRefCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CIConfigPage = {
  items: CIConfigItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CIConfigListFilters = {
  page: number;
  pageSize: number;
  keyword?: string;
};

export type CIConfigFormValue = {
  name: string;
  imageRegistry: string;
  imageTagRuleType: CIConfigTagRuleType;
  imageTagTemplate: string;
  withTimestamp: boolean;
  withCommit: boolean;
  makefilePath: string;
  makeCommand: string;
  dockerfilePath: string;
};

const METAHUB_BASE_URL = (import.meta.env.VITE_METAHUB_BASE_URL as string | undefined)?.trim() ?? '';

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

function normalizeRegistry(value: string) {
  return value.trim().replace(/\/+$/, '');
}

function normalizePath(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function formatCIConfigTagRule(rule: CIConfigTagRule) {
  switch (rule.type) {
    case 'branch': {
      const extras = [];
      if (rule.withTimestamp) {
        extras.push('时间戳');
      }
      if (rule.withCommit) {
        extras.push('Commit');
      }
      return extras.length > 0 ? `分支名 + ${extras.join(' + ')}` : '分支名';
    }
    case 'tag':
      return 'Git Tag';
    case 'commit':
      return 'Commit';
    case 'timestamp':
      return '时间戳';
    case 'custom':
      return `自定义: ${rule.template}`;
  }
}

export function ciConfigFromMetahub(dto: MetahubCIConfigDTO): CIConfigItem {
  const imageTagRule: CIConfigTagRule = {
    type: dto.image_tag_rule.type,
    template: dto.image_tag_rule.template ?? '',
    withTimestamp: dto.image_tag_rule.with_timestamp ?? false,
    withCommit: dto.image_tag_rule.with_commit ?? false,
  };
  const buildSpec: CIConfigBuildSpec = {
    makefilePath: dto.build_spec.makefile_path || './Makefile',
    makeCommand: dto.build_spec.make_command || 'build',
    dockerfilePath: dto.build_spec.dockerfile_path || './Dockerfile',
    dockerContext: dto.build_spec.docker_context || '.',
  };

  return {
    id: dto.id,
    businessUnitID: dto.business_unit_id,
    name: dto.name,
    imageRegistry: dto.image_registry,
    imageRepo: dto.image_repo,
    fullImageRepo: dto.full_image_repo,
    imageTagRule,
    tagRuleLabel: formatCIConfigTagRule(imageTagRule),
    buildSpec,
    deployPlanRefCount: dto.deploy_plan_ref_count,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function ciConfigToFormValue(item: CIConfigItem): CIConfigFormValue {
  return {
    name: item.name,
    imageRegistry: item.imageRegistry,
    imageTagRuleType: item.imageTagRule.type,
    imageTagTemplate: item.imageTagRule.template,
    withTimestamp: item.imageTagRule.withTimestamp,
    withCommit: item.imageTagRule.withCommit,
    makefilePath: item.buildSpec.makefilePath,
    makeCommand: item.buildSpec.makeCommand,
    dockerfilePath: item.buildSpec.dockerfilePath,
  };
}

function toImageTagRulePayload(value: CIConfigFormValue): CIConfigImageTagRuleDTO {
  if (value.imageTagRuleType === 'custom') {
    return {
      type: 'custom',
      template: value.imageTagTemplate.trim(),
    };
  }

  return {
    type: value.imageTagRuleType,
    with_timestamp: value.imageTagRuleType === 'branch' ? value.withTimestamp : false,
    with_commit: value.imageTagRuleType === 'branch' ? value.withCommit : false,
  };
}

export function ciConfigToCreatePayload(value: CIConfigFormValue): CreateCIConfigRequest {
  return {
    name: value.name.trim(),
    image_registry: normalizeRegistry(value.imageRegistry),
    image_tag_rule: toImageTagRulePayload(value),
    build_spec: {
      makefile_path: normalizePath(value.makefilePath, './Makefile'),
      make_command: value.makeCommand.trim() || 'build',
      dockerfile_path: normalizePath(value.dockerfilePath, './Dockerfile'),
    },
  };
}

export function ciConfigToUpdatePayload(value: CIConfigFormValue): UpdateCIConfigRequest {
  return ciConfigToCreatePayload(value);
}

export async function listBusinessUnitCIConfigs(
  businessUnitID: number,
  filters: CIConfigListFilters,
): Promise<CIConfigPage> {
  const query = new URLSearchParams();
  query.set('page', String(filters.page));
  query.set('page_size', String(filters.pageSize));
  if (filters.keyword?.trim()) {
    query.set('keyword', filters.keyword.trim());
  }

  const dto = await request<MetahubCIConfigPageDTO>(`/api/v1/business-units/${businessUnitID}/ci-configs?${query.toString()}`);
  return {
    items: dto.items.map(ciConfigFromMetahub),
    total: dto.total,
    page: dto.page,
    pageSize: dto.page_size,
  };
}

export async function getCIConfig(ciConfigID: number): Promise<CIConfigItem> {
  const dto = await request<MetahubCIConfigDTO>(`/api/v1/ci-configs/${ciConfigID}`);
  return ciConfigFromMetahub(dto);
}

export async function createBusinessUnitCIConfig(
  businessUnitID: number,
  value: CIConfigFormValue,
): Promise<CIConfigItem> {
  const dto = await request<MetahubCIConfigDTO>(`/api/v1/business-units/${businessUnitID}/ci-configs`, {
    method: 'POST',
    body: JSON.stringify(ciConfigToCreatePayload(value)),
  });
  return ciConfigFromMetahub(dto);
}

export async function updateCIConfig(ciConfigID: number, value: CIConfigFormValue): Promise<CIConfigItem> {
  const dto = await request<MetahubCIConfigDTO>(`/api/v1/ci-configs/${ciConfigID}`, {
    method: 'PUT',
    body: JSON.stringify(ciConfigToUpdatePayload(value)),
  });
  return ciConfigFromMetahub(dto);
}

export async function deleteCIConfig(ciConfigID: number): Promise<void> {
  await request<Record<string, never>>(`/api/v1/ci-configs/${ciConfigID}`, {
    method: 'DELETE',
  });
}
