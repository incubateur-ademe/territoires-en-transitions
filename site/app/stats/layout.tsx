'use client';

import Section from '@components/sections/Section';
import {useState} from 'react';
import RegionAndDeptFilters from './RegionAndDeptFilters';

/**
 * Layout de la page Statistiques
 *
 * @param children - Composant enfant à inclure dans le layout
 */

const StatsLayout = ({children}: {children: React.ReactNode}) => {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <>
      <Section
        className="flex-col"
        containerClassName="!pb-0"
        customBackground="#fff"
      >
        <h2>Statistiques{title ? ` - ${title}` : ''}</h2>
        <RegionAndDeptFilters onChange={setTitle} />
      </Section>
      {children}
    </>
  );
};

export default StatsLayout;
