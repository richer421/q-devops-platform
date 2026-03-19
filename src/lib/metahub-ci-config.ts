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
  image_tag_rule: CIConfigImageTagRuleDTO;
  build_spec: {
    makefile_path: string;
    make_command: string;
    dockerfile_path: string;
  };
};

type UpdateCIConfigRequest = {
  name: string;
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

function normalizePath(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeMakeCommand(value: string) {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'build') {
    return 'make build';
  }
  return trimmed;
}

export function formatCIConfigTagRule(rule: CIConfigTagRule) {
  switch (rule.type) {
    case 'branch': {
      const extras: string[] = [];
      if (rule.withTimestamp) {
        extras.push('${timestamp}');
      }
      if (rule.withCommit) {
        extras.push('${commit}');
      }
      return extras.length > 0 ? ['${branch}', ...extras].join('-') : '${branch}';
    }
    case 'tag':
      return '${tag}';
    case 'commit':
      return '${commit}';
    case 'timestamp':
      return '${timestamp}';
    case 'custom':
      return rule.template.trim() || '${branch}';
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
    makeCommand: normalizeMakeCommand(dto.build_spec.make_command || ''),
    dockerfilePath: dto.build_spec.dockerfile_path || './Dockerfile',
    dockerContext: dto.build_spec.docker_context || '.',
  };

  return {
    id: dto.id,
    businessUnitID: dto.business_unit_id,
    name: dto.name,
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
    image_tag_rule: toImageTagRulePayload(value),
    build_spec: {
      makefile_path: normalizePath(value.makefilePath, './Makefile'),
      make_command: normalizeMakeCommand(value.makeCommand),
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
