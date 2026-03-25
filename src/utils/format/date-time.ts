function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateTimeYMDHM(value: string | undefined | null) {
  if (!value) {
    return '-';
  }

  const normalized = value.trim();
  if (!normalized) {
    return '-';
  }

  const plainMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (plainMatch) {
    return `${plainMatch[1]}/${plainMatch[2]}/${plainMatch[3]} ${plainMatch[4]}:${plainMatch[5]}`;
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return normalized;
  }

  const date = new Date(timestamp);
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
