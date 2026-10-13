import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodiciteEnum,
  type SupportedIndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import type { ComponentProps } from 'react';

const options = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: {
    add: appLabels.ajouterAnnee,
    duplicate: appLabels.indicateurAnneeExistante,
    submit: appLabels.validerAjouterAnnee,
    success: appLabels.indicateurAnneeAjoutee,
    inputMode: 'numeric',
  },
} satisfies Record<
  SupportedIndicateurPeriodicite,
  {
    add: string;
    duplicate: string;
    submit: string;
    success: string;
    inputMode: ComponentProps<'input'>['inputMode'];
  }
>;

export const getIndicateurPeriodeInputOptions = (
  periodicite: SupportedIndicateurPeriodicite
) => options[periodicite];
