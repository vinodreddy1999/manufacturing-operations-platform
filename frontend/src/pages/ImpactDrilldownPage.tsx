import { useParams } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { ImpactDrilldown } from '../impact/components/ImpactDrilldown';
import { getImpactMetric } from '../impact/data';

export function ImpactDrilldownPage() {
  const { module = '', metric = '' } = useParams();
  const impactMetric = getImpactMetric(module, metric);
  if (!impactMetric) return <EmptyState title="Impact metric not found" description="This module or metric is not available in the current impact model." />;
  return <ImpactDrilldown metric={impactMetric} />;
}
