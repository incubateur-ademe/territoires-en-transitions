import React, {ReactNode} from 'react';
import IndicateursRenseignes from './IndicateursRenseignes';
import ValeursIndicateursRenseignees from './ValeursIndicateursRenseignees';
import ValeursIndicateursPersoRenseignees from './ValeursIndicateursPersoRenseignees';
import {ChartHead} from './headings';

type EvolutionIndicateursProps = {
  region?: string;
  department?: string;
};

export function EvolutionIndicateurs({
  region = '',
  department = '',
}: EvolutionIndicateursProps) {
  return (
    <>
      <ChartHead>
        Évolution de l’utilisation des indicateurs
        <br />
        {/* xxx collectivités ont renseigné des indicateurs */}
      </ChartHead>
      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <Column>
          <IndicateursRenseignes region={region} department={department} />
        </Column>
        <Column>
          <ValeursIndicateursRenseignees
            region={region}
            department={department}
          />
        </Column>
        <Column>
          <ValeursIndicateursPersoRenseignees
            region={region}
            department={department}
          />
        </Column>
      </div>
    </>
  );
}

const Column = ({children}: {children: ReactNode[] | ReactNode}) => (
  <div className="fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4">
    {children}
  </div>
);
