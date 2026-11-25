import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type SupportedIndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import { useState, type ReactNode } from 'react';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';

export type IndicateurTableDeclarationProps = {
  canWrite: boolean;
  periodicite: SupportedIndicateurPeriodicite | undefined;
  existingPeriodes: readonly IndicateurPeriode[];
  declarePeriode: (periode: IndicateurPeriode) => Promise<void>;
  openModalState?: OpenState;
};

export type IndicateurTableDeclaration = {
  header?: ReactNode;
  periodeToReveal?: IndicateurPeriode;
};

/** Keeps period declaration independent from the table used to edit values. */
export const useIndicateurTableDeclaration = ({
  canWrite,
  periodicite,
  existingPeriodes,
  declarePeriode,
  openModalState,
}: IndicateurTableDeclarationProps): IndicateurTableDeclaration => {
  const [periodeToReveal, setPeriodeToReveal] = useState<IndicateurPeriode>();
  const existingKeys = new Set(existingPeriodes.map(IndicateurPeriodes.key));

  const addPeriode = async (
    periode: IndicateurPeriode<SupportedIndicateurPeriodicite>
  ): Promise<boolean> => {
    const key = IndicateurPeriodes.key(periode);
    if (
      !canWrite ||
      periode.periodicite !== periodicite ||
      existingKeys.has(key)
    )
      return false;

    try {
      await declarePeriode(periode);
      setPeriodeToReveal(periode);
      return true;
    } catch {
      return false;
    }
  };

  return {
    periodeToReveal,
    header: canWrite && periodicite !== undefined && (
      <AddIndicateurPeriodeHeader
        periodicite={periodicite}
        existingPeriodes={existingPeriodes}
        onAdd={addPeriode}
        focusRequested={openModalState?.isOpen}
        onFocusHandled={() => openModalState?.setIsOpen(false)}
      />
    ),
  };
};
