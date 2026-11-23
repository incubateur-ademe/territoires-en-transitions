'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { JSX } from 'react';
import { useIndicateurSousIndicateursTable } from '../context/indicateur-sous-indicateurs-table.context';

type Props = {
  parentId: number;
  childCount: number;
  onCreated?: (indicateurId: number) => void;
  variant?: 'primary' | 'outlined';
  size?: 'xs' | 'sm';
};

export const CreateSousIndicateurButton = ({
  parentId,
  childCount,
  onCreated,
  variant = 'outlined',
  size = 'sm',
}: Props): JSX.Element => {
  const { useCreateSousIndicateur } = useIndicateurSousIndicateursTable();
  const createSousIndicateur = useCreateSousIndicateur();

  return (
    <Button
      variant={variant}
      size={size}
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
