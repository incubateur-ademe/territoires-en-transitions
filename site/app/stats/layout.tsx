'use client';

import {fr} from '@codegouvfr/react-dsfr';
import {useState} from 'react';
import RegionAndDeptFilters from './RegionAndDeptFilters';

const StatsLayout = ({children}: {children: JSX.Element}) => {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <div className="fr-container-fluid">
      <section className={`fr-container ${fr.cx('fr-mb-4w')}`}>
        <h1 className={fr.cx('fr-mt-4w')}>
          Statistiques{title ? ` - ${title}` : ''}
        </h1>
        <RegionAndDeptFilters onChange={setTitle} />
      </section>
      {children}
    </div>
  );
};

export default StatsLayout;
