import React, {useState} from 'react';

import {LazyDetails} from 'ui/shared/LazyDetails';
import {Chevron} from 'ui/shared/Chevron';
import {IndicateurReferentiel} from 'generated/models';
import {IndicateurPersonnaliseCardContent} from './IndicateurPersonnaliseCardContent';
import {IndicateurReferentielCardContent} from 'app/pages/collectivite/Indicateurs/IndicateurReferentielCardContent';
import {IndicateurPersonnaliseStorable} from 'storables';

export const AnyIndicateurCard = ({
  startOpen = true,
  children,
  title,
}: {
  children: React.ReactElement;
  startOpen?: boolean;
  title: string;
}) => {
  const [opened, setOpened] = useState(startOpen);
  return (
    <div className="mt-2  px-5 py-4 bg-beige mb-5">
      <LazyDetails
        startOpen={startOpen}
        summary={
          <div className="flex items-center justify-between">
            <h3 className="fr-h3 mb-6">{title}</h3>
            <Chevron direction={opened ? 'down' : 'left'} />
          </div>
        }
        onChange={setOpened}
      >
        <div className=" ml-8 mb-6">{children}</div>
      </LazyDetails>
    </div>
  );
};

export const IndicateurReferentielCard = ({
  indicateur,
  startOpen = true,
}: {
  indicateur: IndicateurReferentiel;
  startOpen?: boolean;
}) => (
  <AnyIndicateurCard title={indicateur.nom} startOpen={startOpen}>
    <IndicateurReferentielCardContent indicateur={indicateur} />
  </AnyIndicateurCard>
);

export const IndicateurPersonnaliseCard = ({
  indicateur,
  startOpen = true,
}: {
  indicateur: IndicateurPersonnaliseStorable;
  startOpen?: boolean;
}) => (
  <AnyIndicateurCard title={indicateur.nom} startOpen={startOpen}>
    <IndicateurPersonnaliseCardContent indicateur={indicateur} />
  </AnyIndicateurCard>
);
