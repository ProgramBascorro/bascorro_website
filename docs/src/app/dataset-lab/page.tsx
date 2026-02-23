import type { Metadata } from 'next';
import DatasetLabClient from '@/components/dataset-lab/DatasetLabClient';

export const metadata: Metadata = {
  title: 'Dataset Lab',
  description: 'Internal data labeling tool for BASCORRO datasets.',
};

export default function DatasetLabPage() {
  return <DatasetLabClient />;
}
