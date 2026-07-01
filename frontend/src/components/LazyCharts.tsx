import { Suspense, lazy } from 'react';

import { LazyChunkBoundary } from './LazyChunkBoundary';
import { LoadingState } from './LoadingState';
import type { ChartDatum } from './ChartImplementations';

const LazyBarChartImpl = lazy(() => import('./ChartImplementations').then((module) => ({ default: module.LazyBarChartImpl })));
const LazyLineChartImpl = lazy(() => import('./ChartImplementations').then((module) => ({ default: module.LazyLineChartImpl })));
const BusinessImpactChartImpl = lazy(() => import('./ChartImplementations').then((module) => ({ default: module.BusinessImpactChartImpl })));

function ChartFallback() {
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/25">
      <LoadingState label="Loading chart" />
    </div>
  );
}

export function LazyBarChart(props: {
  data: ChartDatum[];
  bars: string[];
  height?: string;
  xKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  return (
    <LazyChunkBoundary label="Chart">
      <Suspense fallback={<ChartFallback />}>
        <LazyBarChartImpl {...props} />
      </Suspense>
    </LazyChunkBoundary>
  );
}

export function LazyLineChart(props: { data: ChartDatum[]; lineKey?: string; height?: string; xKey?: string }) {
  return (
    <LazyChunkBoundary label="Chart">
      <Suspense fallback={<ChartFallback />}>
        <LazyLineChartImpl {...props} />
      </Suspense>
    </LazyChunkBoundary>
  );
}

export function LazyBusinessImpactChart(props: { data: ChartDatum[]; currency: string }) {
  return (
    <LazyChunkBoundary label="Business impact chart">
      <Suspense fallback={<ChartFallback />}>
        <BusinessImpactChartImpl {...props} />
      </Suspense>
    </LazyChunkBoundary>
  );
}
