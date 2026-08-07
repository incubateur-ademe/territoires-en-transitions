'use client';

import { DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS } from '@/app/demarches/pcaet/constants';
import type {
  DemarchePcaet,
  DemarchePcaetStatutPublication,
} from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
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
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: setPublicationStatus } = useMutation(
    trpc.demarches.pcaet.setPublicationStatus.mutationOptions({
      onSuccess: async (updated) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.get.queryKey({
            collectiviteId,
            demarcheId: demarche.id,
          }),
        });
        onUpdated({
          ...demarche,
          statut: updated.status,
          statutPublication: updated.publicationStatus,
          datePublication: updated.publishedAt,
        });
      },
    })
  );

  const handleChange = (statutPublication: DemarchePcaetStatutPublication) => {
    setPublicationStatus({
      collectiviteId,
      demarcheId: demarche.id,
      publicationStatus: statutPublication,
    });
  };

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-grey-3 bg-grey-1 p-4 min-w-[200px]"
      data-test="demarche-statut-publication"
    >
      <span className="text-xs font-bold uppercase text-grey-7">
        {appLabels.demarcheStatutControlLabel}
      </span>
      <ButtonGroup
        activeButtonId={demarche.statutPublication}
        variant="neutral"
        size="sm"
        buttons={(
          ['draft', 'published'] as DemarchePcaetStatutPublication[]
        ).map((id) => ({
          id,
          children: DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS[id],
          onClick: () => handleChange(id),
        }))}
      />
      {demarche.datePublication ? (
        <p className="text-xs text-grey-6">
          {appLabels.demarcheStatutPublieeLe({
            date: new Date(demarche.datePublication).toLocaleDateString('fr-FR'),
          })}
        </p>
      ) : null}
    </div>
  );
};
