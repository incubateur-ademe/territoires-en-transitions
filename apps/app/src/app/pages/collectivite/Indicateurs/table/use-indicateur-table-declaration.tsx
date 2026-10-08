import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { Button } from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { useState, type ReactNode } from 'react';
import type { PreparedData } from '../data/prepare-data';
import { EditValeursModal } from './edit-valeurs-modal';

export type IndicateurTableDeclarationProps = {
  canWrite: boolean;
  collectiviteId: number;
  definition: Pick<IndicateurDefinition, 'id'>;
  data: PreparedData;
  existingPeriodes: readonly IndicateurPeriode[];
  openModalState?: OpenState;
};

export type IndicateurTableDeclaration = {
  controls?: ReactNode;
  modal?: ReactNode;
  header?: ReactNode;
  additionalPeriodes?: readonly IndicateurPeriode[];
  removePeriode?: (periode: IndicateurPeriode) => void;
};

/** Keeps period declaration independent from the table used to edit values. */
export const useIndicateurTableDeclaration = ({
  canWrite,
  collectiviteId,
  definition,
  data,
  openModalState,
}: IndicateurTableDeclarationProps): IndicateurTableDeclaration => {
  const [isOpen, setIsOpen] = useState(openModalState?.isOpen ?? false);
  const requestedOpen = openModalState?.isOpen ?? false;
  const [previousRequestedOpen, setPreviousRequestedOpen] =
    useState(requestedOpen);
  if (previousRequestedOpen !== requestedOpen) {
    setPreviousRequestedOpen(requestedOpen);
    setIsOpen(requestedOpen);
  }
  return {
    controls: canWrite && (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        {appLabels.ajouterAnnee}
      </Button>
    ),
    modal: canWrite && isOpen && (
      <EditValeursModal
        collectiviteId={collectiviteId}
        definition={definition}
        data={data}
        openState={{
          isOpen,
          setIsOpen: (value) => {
            setIsOpen(value);
            openModalState?.setIsOpen(value);
          },
        }}
      />
    ),
  };
};
