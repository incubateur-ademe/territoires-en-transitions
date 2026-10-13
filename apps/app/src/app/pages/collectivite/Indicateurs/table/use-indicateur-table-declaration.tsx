import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
  type SupportedIndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import type { ReactNode } from 'react';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { getIndicateurPeriodeInputOptions } from './indicateur-periode-input.options';

export type IndicateurTableDeclarationProps = {
  canWrite: boolean;
  periodicite: SupportedIndicateurPeriodicite;
  collectiviteId: number;
  definition: Pick<IndicateurDefinition, 'id'>;
  existingPeriodes: readonly IndicateurPeriode[];
  openModalState?: OpenState;
};

export type IndicateurTableDeclaration = {
  header?: ReactNode;
};

/** Keeps period declaration independent from the table used to edit values. */
export const useIndicateurTableDeclaration = ({
  canWrite,
  periodicite,
  collectiviteId,
  definition,
  existingPeriodes,
  openModalState,
}: IndicateurTableDeclarationProps): IndicateurTableDeclaration => {
  const { mutateAsync: upsertValeur } = useUpsertIndicateurValeur({
    successMessage: getIndicateurPeriodeInputOptions(periodicite).success,
    disableErrorToast: true,
  });
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
      await upsertValeur({
        collectiviteId,
        indicateurId: definition.id,
        periodicite: periode.periodicite,
        dateValeur: periode.dateDebut,
      });
      return true;
    } catch {
      return false;
    }
  };

  return {
    header: canWrite && (
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
