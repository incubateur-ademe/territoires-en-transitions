import { useLabellisationParcours } from '@/app/referentiels/labellisations/useLabellisationParcours';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Etoile, ReferentielId } from '@tet/domain/referentiels';
import { useState } from 'react';
import { toEtoileCourante } from './etoile-courante';

type EtoileVisee = {
  etoileVisee: Etoile | undefined;
  isEtoileCourante: boolean;
  selectEtoileVisee: (etoile: Etoile) => void;
};

export const useEtoileVisee = (referentielId: ReferentielId): EtoileVisee => {
  const { collectiviteId } = useCurrentCollectivite();
  const [etoileChoisie, selectEtoileVisee] = useState<Etoile>();
  const { parcours } = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });
  const etoileCourante = parcours ? toEtoileCourante(parcours) : undefined;

  return {
    etoileVisee: etoileChoisie ?? etoileCourante,
    isEtoileCourante: etoileChoisie === undefined,
    selectEtoileVisee,
  };
};
