import React, { ReactNode } from 'react';
import IndicateursRenseignes from './IndicateursRenseignes';
import ValeursIndicateursRenseignees from './ValeursIndicateursRenseignees';
import ValeursIndicateursPersoRenseignees from './ValeursIndicateursPersoRenseignees';

export function EvolutionIndicateurs({}) {
  return (
    <>
      {/* <ChartHead>xxx collectivités ont renseigné des indicateurs </ChartHead> */}
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <Column>
          <IndicateursRenseignes />
        </Column>
        <Column>
          <ValeursIndicateursRenseignees />
        </Column>
        <Column>
          <ValeursIndicateursPersoRenseignees />
        </Column>
      </div>
    </>
  );
}

const Column = ({ children }: { children: ReactNode[] | ReactNode }) => (
  <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4">
    {children}
  </div>
);
