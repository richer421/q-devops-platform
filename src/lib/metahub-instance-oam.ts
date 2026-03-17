import type { Instance } from '../mock';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type MetahubInstanceOAMDTO = {
  id: number;
  business_unit_id: number;
  name: string;
  env: string;
  schema_version: string;
  oam_application: Record<string, unknown>;
  frontend_payload: Record<string, unknown>;
};

type UpsertInstanceOAMPayload = {
  name: string;
  env: string;
  schema_version: string;
  oam_application: Record<string, unknown>;
  frontend_payload: Record<string, unknown>;
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

function sanitizeInstance(raw: Partial<Instance>, dto: MetahubInstanceOAMDTO): Instance {
  return {
    id: String(dto.id),
    buId: String(dto.business_unit_id),
    name: raw.name ?? dto.name,
    env: raw.env ?? dto.env,
    type: raw.type ?? 'Deployment',
    instanceType: raw.instanceType ?? 'deployment',
    replicas: raw.replicas ?? 1,
    readyReplicas: raw.readyReplicas ?? 0,
    cpu: raw.cpu ?? '250m',
    memory: raw.memory ?? '256Mi',
    yaml: raw.yaml ?? '',
    spec: raw.spec,
    attachResources: raw.attachResources,
    pods: raw.pods ?? [],
    status: raw.status ?? 'stopped',
  };
}

export function instanceFromMetahub(dto: MetahubInstanceOAMDTO): Instance {
  const basic = (dto.frontend_payload?.basic ?? {}) as Record<string, unknown>;
  const basicInstance = basic.instance;
  if (basicInstance && typeof basicInstance === 'object') {
    return sanitizeInstance(basicInstance as Partial<Instance>, dto);
  }

  return sanitizeInstance(
    {
      yaml: typeof basic.yaml === 'string' ? basic.yaml : '',
    },
    dto,
  );
}

export function instanceToMetahubPayload(instance: Instance): UpsertInstanceOAMPayload {
  return {
    name: instance.name,
    env: instance.env,
    schema_version: 'v1alpha1',
    oam_application: {
      apiVersion: 'q.oam/v1alpha1',
      kind: 'InstanceApplication',
      component: {
        name: instance.name,
        type: 'pod',
        properties: {
          mainContainer: {
            name: instance.spec?.deployment?.template?.spec?.containers?.[0]?.name ?? instance.name,
            image: 'IMAGE',
          },
        },
      },
    },
    frontend_payload: {
      basic: {
        instance,
        yaml: instance.yaml ?? '',
      },
    },
  };
}

export async function listBusinessUnitInstanceOAMs(
  businessUnitID: number,
  filters?: { env?: string; keyword?: string },
): Promise<Instance[]> {
  const query = new URLSearchParams();
  if (filters?.env) {
    query.set('env', filters.env);
  }
  if (filters?.keyword) {
    query.set('keyword', filters.keyword);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const rows = await request<MetahubInstanceOAMDTO[]>(`/api/v1/business-units/${businessUnitID}/instance-oams${suffix}`);
  return rows.map(instanceFromMetahub);
}

export async function createBusinessUnitInstanceOAM(
  businessUnitID: number,
  instance: Instance,
): Promise<Instance> {
  const payload = instanceToMetahubPayload(instance);
  const row = await request<MetahubInstanceOAMDTO>(`/api/v1/business-units/${businessUnitID}/instance-oams`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return instanceFromMetahub(row);
}

export async function updateInstanceOAM(instance: Instance): Promise<Instance> {
  const instanceID = Number(instance.id);
  if (!Number.isFinite(instanceID)) {
    return instance;
  }

  const payload = instanceToMetahubPayload(instance);
  const row = await request<MetahubInstanceOAMDTO>(`/api/v1/instance-oams/${instanceID}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return instanceFromMetahub(row);
}
