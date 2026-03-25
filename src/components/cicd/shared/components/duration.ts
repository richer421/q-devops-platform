export function formatElapsedDuration(
  startedAt?: string,
  finishedAt?: string,
  nowMs = Date.now(),
) {
  if (!startedAt) {
    return null;
  }

  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) {
    return null;
  }

  const finishedMs = finishedAt ? Date.parse(finishedAt) : nowMs;
  if (Number.isNaN(finishedMs) || finishedMs < startedMs) {
    return null;
  }

  const durationSeconds = Math.round((finishedMs - startedMs) / 1000);
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${minutes}分${String(seconds).padStart(2, '0')}秒`;
}
