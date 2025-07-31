'use client';

import Section from '@/site/components/sections/Section';
import { useState } from 'react';
import RegionAndDeptFilters from './RegionAndDeptFilters';

/**
 * Layout de la page Statistiques
 *
 * @param children - Composant enfant à inclure dans le layout
 */

const StatsLayout = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <>
      <Section containerClassName="bg-primary-1 !py-28" className="!gap-0">
        <h1>Statistiques{title ? ` - ${title}` : ''}</h1>
        <RegionAndDeptFilters onChange={setTitle} />
      </Section>
      {children}
    </>
  );
};

export default StatsLayout;
