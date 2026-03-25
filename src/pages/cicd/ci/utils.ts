import type { UIEvent } from 'react';
import type { SelectOption } from './usePagedSelectOptions';

export function isNearPopupBottom(event: UIEvent<HTMLDivElement>) {
  const target = event.currentTarget;
  return target.scrollHeight - target.scrollTop - target.clientHeight < 24;
}

export function withSelectedOption(
  options: ReadonlyArray<SelectOption>,
  selectedID?: number,
  selectedLabel?: string,
) {
  if (!selectedID || !selectedLabel?.trim()) {
    return [...options];
  }

  if (options.some((item) => item.value === selectedID)) {
    return [...options];
  }

  return [{ value: selectedID, label: selectedLabel }, ...options];
}
