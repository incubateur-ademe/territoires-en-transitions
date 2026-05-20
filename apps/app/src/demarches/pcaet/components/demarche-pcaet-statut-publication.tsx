'use client';

import { DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { setDemarchePcaetStatutPublication } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type {
  DemarchePcaet,
  DemarchePcaetStatutPublication,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import { ButtonGroup } from '@tet/ui';

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  onUpdated: (demarche: DemarchePcaet) => void;
};

export const DemarchePcaetStatutPublicationControl = ({
  demarche,
  collectiviteId,
  onUpdated,
}: Props) => {
  const handleChange = (statutPublication: DemarchePcaetStatutPublication) => {
    const updated = setDemarchePcaetStatutPublication(
      collectiviteId,
      demarche.id,
      statutPublication
    );
    if (updated) {
      onUpdated(updated);
    }
  };

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-grey-3 bg-grey-1 p-4 min-w-[200px]"
      data-test="demarche-statut-publication"
    >
      <span className="text-xs font-bold uppercase text-grey-7">Statut</span>
      <ButtonGroup
        activeButtonId={demarche.statutPublication}
        variant="neutral"
        size="sm"
        buttons={(
          ['brouillon', 'publie'] as DemarchePcaetStatutPublication[]
        ).map((id) => ({
          id,
          children: DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS[id],
          onClick: () => handleChange(id),
        }))}
      />
      {demarche.datePublication ? (
        <p className="text-xs text-grey-6">
          Publiée le{' '}
          {new Date(demarche.datePublication).toLocaleDateString('fr-FR')}
        </p>
      ) : null}
    </div>
  );
};
