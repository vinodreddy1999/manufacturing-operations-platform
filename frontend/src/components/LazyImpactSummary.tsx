import { Suspense, lazy } from 'react';

import { LazyChunkBoundary } from './LazyChunkBoundary';
import { LoadingState } from './LoadingState';

const ModuleImpactSummary = lazy(() => import('../impact/components/ModuleImpactSummary').then((module) => ({ default: module.ModuleImpactSummary })));

export function LazyImpactSummary({ moduleKey }: { moduleKey: string }) {
  return (
    <LazyChunkBoundary label="Business impact summary">
      <Suspense fallback={<LoadingState label="Loading business impact summary" />}>
        <ModuleImpactSummary moduleKey={moduleKey} />
      </Suspense>
    </LazyChunkBoundary>
  );
}
