'use client';

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
    <div className="fr-container-fluid">
      <section className={`fr-container fr-mb-4w`}>
        <h1 className={'fr-mt-4w'}>Statistiques{title ? ` - ${title}` : ''}</h1>
        <RegionAndDeptFilters onChange={setTitle} />
      </section>
      {children}
    </div>
  );
};

export default StatsLayout;
