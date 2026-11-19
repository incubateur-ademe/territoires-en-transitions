'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import { useIndicateurSousIndicateursTable } from '../../context/indicateur-sous-indicateurs-table.context';

type Props = {
  parentId: number;
  childCount: number;
  onCreated?: (indicateurId: number) => void;
};

export const CreateSousIndicateurButton = ({
  parentId,
  childCount,
  onCreated,
}: Props): JSX.Element => {
  const { useCreateSousIndicateur } = useIndicateurSousIndicateursTable();
  const createSousIndicateur = useCreateSousIndicateur();

  return (
    <Button
      variant="outlined"
      size="sm"
      icon="add-line"
      onClick={() =>
        createSousIndicateur(
          {
            parentId,
            titre: appLabels.indicateurSousIndicateurNomProvisoire({
              numero: childCount + 1,
            }),
          },
          onCreated ? { onCreated } : undefined
        )
      }
    >
      {appLabels.indicateurCreerSousIndicateur}
    </Button>
  );
};
