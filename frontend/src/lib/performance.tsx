import { useEffect, useMemo, useRef, useState, type UIEvent } from 'react';

export type PageMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

export function useDebouncedValue<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}

export function useVisibleOnce<TElement extends HTMLElement>(rootMargin = '180px') {
  const ref = useRef<TElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
}

export function useVirtualRows<T>(rows: T[], rowHeight = 54, overscan = 6) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(321);
  const totalHeight = rows.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
  const visibleRows = useMemo(() => rows.slice(startIndex, endIndex), [endIndex, rows, startIndex]);

  return {
    endIndex,
    onScroll: (event: UIEvent<HTMLElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
      setViewportHeight(event.currentTarget.clientHeight || viewportHeight);
    },
    startIndex,
    totalHeight,
    translateY: startIndex * rowHeight,
    visibleRows,
  };
}

export function ratingForMetric(name: string, value: number): PageMetric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    FID: [100, 300],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name] ?? [250, 1000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function collectNavigationMetrics(): PageMetric[] {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!navigation) return [];
  const metrics = [
    ['TTFB', navigation.responseStart - navigation.requestStart],
    ['DOM_READY', navigation.domContentLoadedEventEnd - navigation.startTime],
    ['LOAD', navigation.loadEventEnd - navigation.startTime],
  ] as const;
  return metrics.map(([name, value]) => ({ name, value: Math.max(0, Math.round(value)), rating: ratingForMetric(name, value) }));
}
