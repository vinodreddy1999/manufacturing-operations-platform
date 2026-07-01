import { LazyLineChart } from '../../components/LazyCharts';
import type { ImpactHistoryPoint } from '../types';

export function TrendChart({ data, unit }: { data: ImpactHistoryPoint[]; unit: string }) {
  void unit;
  return <LazyLineChart data={data.map((item) => ({ name: item.period, value: item.value }))} />;
}
