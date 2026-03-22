import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

export type SelectOption = {
  value: number;
  label: string;
};

type OptionPage = {
  items: SelectOption[];
  total: number;
};

type LoadOptionPage = (params: {
  page: number;
  pageSize: number;
  keyword?: string;
}) => Promise<OptionPage>;

type UsePagedSelectOptionsParams = {
  enabled?: boolean;
  errorMessage: string;
  loadPage: LoadOptionPage;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 10;

function mergeOptions(current: SelectOption[], incoming: SelectOption[]) {
  const seen = new Set<number>();
  const merged: SelectOption[] = [];

  for (const item of [...current, ...incoming]) {
    if (seen.has(item.value)) {
      continue;
    }
    seen.add(item.value);
    merged.push(item);
  }

  return merged;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function usePagedSelectOptions({
  enabled = true,
  errorMessage,
  loadPage,
  pageSize = DEFAULT_PAGE_SIZE,
}: UsePagedSelectOptionsParams) {
  const loadPageRef = useRef(loadPage);
  const requestIDRef = useRef(0);
  const loadingRef = useRef(false);
  const currentPageRef = useRef(0);
  const totalRef = useRef(0);
  const keywordRef = useRef('');
  const optionsRef = useRef<SelectOption[]>([]);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    loadPageRef.current = loadPage;
  }, [loadPage]);

  const resetState = () => {
    requestIDRef.current += 1;
    loadingRef.current = false;
    currentPageRef.current = 0;
    totalRef.current = 0;
    keywordRef.current = '';
    optionsRef.current = [];
    setOptions([]);
    setLoading(false);
  };

  const runPageLoad = async (params: {
    page: number;
    keyword: string;
    mode: 'replace' | 'append';
  }) => {
    const requestID = requestIDRef.current + 1;
    requestIDRef.current = requestID;
    loadingRef.current = true;
    setLoading(true);

    try {
      const result = await loadPageRef.current({
        page: params.page,
        pageSize,
        keyword: params.keyword || undefined,
      });

      if (requestID !== requestIDRef.current) {
        return;
      }

      const nextOptions =
        params.mode === 'replace'
          ? result.items
          : mergeOptions(optionsRef.current, result.items);

      currentPageRef.current = params.page;
      keywordRef.current = params.keyword;
      totalRef.current = result.total;
      optionsRef.current = nextOptions;
      setOptions(nextOptions);
    } catch (error) {
      if (requestID !== requestIDRef.current) {
        return;
      }

      console.error(error);
      void message.error(getErrorMessage(error, errorMessage));
      if (params.mode === 'replace') {
        currentPageRef.current = 0;
        totalRef.current = 0;
        optionsRef.current = [];
        setOptions([]);
      }
    } finally {
      if (requestID === requestIDRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!enabled) {
      resetState();
      return;
    }

    void runPageLoad({
      page: 1,
      keyword: keywordRef.current,
      mode: 'replace',
    });
  }, [enabled, pageSize, reloadToken]);

  const search = (keyword: string) => {
    if (!enabled) {
      return;
    }

    const trimmedKeyword = keyword.trim();
    void runPageLoad({
      page: 1,
      keyword: trimmedKeyword,
      mode: 'replace',
    });
  };

  const loadMore = () => {
    if (!enabled || loadingRef.current || optionsRef.current.length >= totalRef.current) {
      return;
    }

    void runPageLoad({
      page: currentPageRef.current + 1,
      keyword: keywordRef.current,
      mode: 'append',
    });
  };

  const reset = () => {
    resetState();
    if (enabled) {
      setReloadToken((token) => token + 1);
    }
  };

  return {
    options,
    loading,
    search,
    loadMore,
    reset,
  };
}
