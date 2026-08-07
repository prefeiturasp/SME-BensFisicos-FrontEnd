import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebounced(value), delay);
    return () => globalThis.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
