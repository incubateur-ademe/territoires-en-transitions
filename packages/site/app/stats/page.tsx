'use server';

import {Metadata} from 'next';
import StatisticsDisplay from './StatisticsDisplay';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Statistiques',
  };
}

/**
 * Page de statistiques nationales
 */

export default async function Stats() {
  return <StatisticsDisplay />;
}
