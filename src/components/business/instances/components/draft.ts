import { stringify } from 'yaml';
import type { Instance } from '@/mock';
import { getInstanceStatusMeta } from '@/utils/status';
import type { InstanceDraft } from './types';

function toResourceNames(values?: Record<string, unknown>) {
  return Object.keys(values ?? {});
}

function createNameMap(names: string[]) {
  return names.reduce<Record<string, { metadata: { name: string } }>>(
    (accumulator, name) => {
      if (!name) {
        return accumulator;
      }

      accumulator[name] = {
        metadata: { name },
      };
      return accumulator;
    },
    {},
  );
}

function parseNumeric(value: string) {
  const match = value.trim().match(/(\d+(\.\d+)?)/);
  if (!match) {
    return undefined;
  }

  const next = Number(match[1]);
  return Number.isFinite(next) ? next : undefined;
}

function normalizeCommandParts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}

export function normalizeYamlImagePlaceholder(yaml: string) {
  return yaml.replace(/^(\s*image:\s*).+$/gm, '$1IMAGE');
}

export function cloneDraft(draft: InstanceDraft): InstanceDraft {
  return {
    ...draft,
    ports: [...draft.ports],
    envVars: draft.envVars.map((item) => ({ ...item })),
    configMaps: [...draft.configMaps],
    secrets: [...draft.secrets],
    services: [...draft.services],
  };
}

export function serializeDraft(draft: InstanceDraft) {
  return normalizeYamlImagePlaceholder(
    stringify(
      {
        name: draft.name,
        env: draft.env,
        instance_type: draft.instanceType,
        spec: {
          deployment: {
            replicas: draft.replicas,
            template: {
              spec: {
                containers: [
                  {
                    name: draft.containerName,
                    image: 'IMAGE',
                    command: draft.startupCommand.trim()
                      ? ['/bin/sh', '-c', draft.startupCommand.trim()]
                      : undefined,
                    ports: draft.ports.map((containerPort) => ({ containerPort })),
                    env: draft.envVars,
                    resources: {
                      requests: {
                        cpu: draft.cpu,
                        memory: draft.memory,
                      },
                      limits: {
                        cpu: draft.cpuLimit || undefined,
                        memory: draft.memoryLimit || undefined,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        attach_resources: {
          configMaps: createNameMap(draft.configMaps),
          secrets: createNameMap(draft.secrets),
          services: createNameMap(draft.services),
        },
      },
      { lineWidth: 0 },
    ).trim(),
  );
}

export function buildDraft(instance: Instance): InstanceDraft {
  const deployment = instance.spec?.deployment;
  const container = deployment?.template?.spec?.containers?.[0];
  const resources = container?.resources;

  const draft: InstanceDraft = {
    id: instance.id,
    buId: instance.buId,
    name: instance.name,
    env: instance.env,
    type: instance.type,
    instanceType: instance.instanceType ?? 'deployment',
    replicas: deployment?.replicas ?? instance.replicas,
    readyReplicas: instance.readyReplicas,
    cpu: resources?.requests?.cpu ?? instance.cpu,
    memory: resources?.requests?.memory ?? instance.memory,
    cpuLimit: resources?.limits?.cpu ?? '',
    memoryLimit: resources?.limits?.memory ?? '',
    startupCommand: parseStartupCommand(
      (container as { command?: string | string[] } | undefined)?.command,
      (container as { args?: string | string[] } | undefined)?.args,
    ),
    networkMode: 'k8s-service',
    status: instance.status,
    containerName: container?.name ?? instance.name,
    image: container?.image ?? '',
    ports: (container?.ports ?? [])
      .map((port) => port.containerPort)
      .filter((port): port is number => Number.isFinite(port)),
    envVars: (container?.env ?? []).map((item) => ({ name: item.name, value: item.value })),
    configMaps: toResourceNames(instance.attachResources?.configMaps),
    secrets: toResourceNames(instance.attachResources?.secrets),
    services: toResourceNames(instance.attachResources?.services),
    yaml: '',
  };

  return {
    ...draft,
    yaml: normalizeYamlImagePlaceholder(instance.yaml?.trim() || serializeDraft(draft)),
  };
}

export function toPortSelectValues(ports: number[]) {
  return ports.map((port) => String(port));
}

export function parsePortSelectValues(values: string[]) {
  return values
    .map((item) => Number(item.trim()))
    .filter((item): item is number => Number.isFinite(item));
}

export function parseStartupCommand(command: unknown, args: unknown) {
  const commandParts = normalizeCommandParts(command);
  const argParts = normalizeCommandParts(args);

  if (commandParts.length === 0 && argParts.length === 0) {
    return '';
  }

  const shellExecutors = new Set(['/bin/sh', 'sh', '/bin/bash', 'bash']);
  if (
    commandParts.length >= 3 &&
    shellExecutors.has(commandParts[0]) &&
    commandParts[1] === '-c'
  ) {
    return commandParts.slice(2).join(' ');
  }

  return [...commandParts, ...argParts].join(' ');
}

export function parseMemoryValue(
  value: string,
): { amount: number | undefined; unit: 'Mi' | 'Gi' } {
  const trimmed = value.trim();
  const amount = parseNumeric(trimmed);

  if (trimmed.endsWith('Gi')) {
    return { amount, unit: 'Gi' };
  }

  if (trimmed.endsWith('Mi')) {
    return { amount, unit: 'Mi' };
  }

  return { amount, unit: 'Mi' };
}

export function parseCpuValue(
  value: string,
): { amount: number | undefined; unit: 'm' | 'c' } {
  const trimmed = value.trim();
  const amount = parseNumeric(trimmed);

  if (trimmed.endsWith('c')) {
    return { amount, unit: 'c' };
  }

  if (trimmed.endsWith('m')) {
    return { amount, unit: 'm' };
  }

  return { amount, unit: 'm' };
}

export function deriveInstanceRuntimeStatus(instance: Instance): Instance['status'] {
  const pods = instance.pods ?? [];

  if (pods.length === 0) {
    return 'stopped';
  }

  if (pods.every((pod) => pod.status === 'Running')) {
    return 'running';
  }

  return 'degraded';
}

export function getInstanceRuntimeStatusLabel(instance: Instance) {
  const runtimeStatus = deriveInstanceRuntimeStatus(instance);
  const statusMeta = getInstanceStatusMeta(runtimeStatus);

  if ((instance.pods ?? []).length === 0) {
    return '未运行';
  }

  return statusMeta.label;
}

export function draftToInstance(draft: InstanceDraft, previous?: Instance): Instance {
  return {
    id: draft.id,
    buId: draft.buId,
    name: draft.name,
    env: draft.env,
    type: draft.type,
    instanceType: draft.instanceType,
    replicas: draft.replicas,
    readyReplicas: previous?.readyReplicas ?? Math.min(draft.readyReplicas, draft.replicas),
    cpu: draft.cpu,
    memory: draft.memory,
    yaml: normalizeYamlImagePlaceholder(draft.yaml.trim() || serializeDraft(draft)),
    spec: {
      deployment: {
        replicas: draft.replicas,
        template: {
          spec: {
            containers: [
              {
                name: draft.containerName,
                image: draft.image || 'IMAGE',
                ports: draft.ports.map((port) => ({ containerPort: port })),
                env: draft.envVars.map((item) => ({ name: item.name, value: item.value })),
                resources: {
                  requests: {
                    cpu: draft.cpu,
                    memory: draft.memory,
                  },
                  limits: {
                    cpu: draft.cpuLimit || undefined,
                    memory: draft.memoryLimit || undefined,
                  },
                },
              },
            ],
          },
        },
      },
    },
    attachResources: {
      configMaps: createNameMap(draft.configMaps),
      secrets: createNameMap(draft.secrets),
      services: createNameMap(draft.services),
    },
    pods: previous?.pods ?? [],
    status: previous?.status ?? 'stopped',
  };
}
