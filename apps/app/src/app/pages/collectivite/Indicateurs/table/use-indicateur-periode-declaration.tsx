import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import {
  IndicateurPeriodiciteEnum,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { Button } from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { useState, type ReactNode } from 'react';
import { AddIndicateurPeriodesModal } from './add-indicateur-periodes.modal';
import { useIndicateurTableDeclaration } from './use-indicateur-table-declaration';

type Props = {
  canWrite: boolean;
  periodicite: IndicateurPeriodicite;
  existingPeriodes: readonly IndicateurPeriode[];
  declarePeriode: (periode: IndicateurPeriode) => Promise<void>;
  declarePeriodes: (periodes: IndicateurPeriode[]) => Promise<void>;
  openModalState?: OpenState;
};

type IndicateurPeriodeDeclaration = {
  addPeriode: ReactNode;
  modal: ReactNode;
  periodeToReveal: IndicateurPeriode | undefined;
};

export const useIndicateurPeriodeDeclaration = ({
  canWrite,
  periodicite,
  existingPeriodes,
  declarePeriode,
  declarePeriodes,
  openModalState,
}: Props): IndicateurPeriodeDeclaration => {
  const isAnnual = periodicite === IndicateurPeriodiciteEnum.ANNUELLE;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = openModalState?.isOpen ?? internalIsOpen;
  const setIsOpen = openModalState?.setIsOpen ?? setInternalIsOpen;
  const declaration = useIndicateurTableDeclaration({
    canWrite: canWrite && isAnnual,
    periodicite,
    existingPeriodes,
    declarePeriode,
    openModalState: isAnnual ? openModalState : undefined,
  });

  const addPeriode = isAnnual ? (
    declaration.header
  ) : canWrite ? (
    <Button size="sm" onClick={() => setIsOpen(true)}>
      {getIndicateurPeriodPresentation(periodicite).editor.addLabel}
    </Button>
  ) : undefined;

  const modal =
    !isAnnual && canWrite && isOpen ? (
      <AddIndicateurPeriodesModal
        periodicite={periodicite}
        openState={{ isOpen, setIsOpen }}
        existingPeriodes={existingPeriodes}
        onAdd={declarePeriodes}
      />
    ) : null;

  return { addPeriode, modal, periodeToReveal: declaration.periodeToReveal };
};
