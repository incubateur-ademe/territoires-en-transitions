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
    inputType: 'text',
    placeholder: appLabels.ajouterAnnee,
  },
} satisfies Record<
  SupportedIndicateurPeriodicite,
  {
    add: string;
    duplicate: string;
    submit: string;
    success: string;
    inputMode: ComponentProps<'input'>['inputMode'];
    inputType: 'text' | 'month';
    placeholder: string;
  }
>;

export const getIndicateurPeriodeInputOptions = (
  periodicite: SupportedIndicateurPeriodicite
) => options[periodicite];
