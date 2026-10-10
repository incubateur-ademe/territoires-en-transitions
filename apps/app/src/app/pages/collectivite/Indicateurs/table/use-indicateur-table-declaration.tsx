import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import { appLabels } from '@/app/labels/catalog';
import {
    IndicateurPeriodes,
    IndicateurPeriodiciteEnum,
    type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { OpenState } from '@tet/ui/utils/types';
import type { ReactNode } from 'react';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';

export type IndicateurTableDeclarationProps = {
  canWrite: boolean;
  periodicite?: IndicateurPeriode['periodicite'];
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
  periodicite = IndicateurPeriodiciteEnum.ANNUELLE,
  collectiviteId,
  definition,
  existingPeriodes,
  openModalState,
}: IndicateurTableDeclarationProps): IndicateurTableDeclaration => {
  const { mutateAsync: upsertValeur } = useUpsertIndicateurValeur({
    successMessage: appLabels.indicateurAnneeAjoutee,
    disableErrorToast: true,
  });
  const existingKeys = new Set(existingPeriodes.map(IndicateurPeriodes.key));

  const addPeriode = async (periode: IndicateurPeriode): Promise<boolean> => {
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
