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
  [IndicateurPeriodiciteEnum.MENSUELLE]: {
    add: appLabels.ajouterMois,
    duplicate: appLabels.indicateurPeriodeExistante,
    submit: appLabels.validerAjouterMois,
    success: appLabels.indicateurPeriodeAjoutee,
    inputMode: undefined,
    inputType: 'month',
    placeholder: appLabels.champMois,
  },
  [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: {
    add: appLabels.ajouterTrimestre,
    duplicate: appLabels.indicateurPeriodeExistante,
    submit: appLabels.validerAjouterTrimestre,
    success: appLabels.indicateurPeriodeAjoutee,
    inputMode: undefined,
    inputType: 'text',
    placeholder: appLabels.champTrimestre,
  },
  [IndicateurPeriodiciteEnum.SEMESTRIELLE]: {
    add: appLabels.ajouterSemestre,
    duplicate: appLabels.indicateurPeriodeExistante,
    submit: appLabels.validerAjouterSemestre,
    success: appLabels.indicateurPeriodeAjoutee,
    inputMode: undefined,
    inputType: 'text',
    placeholder: appLabels.champSemestre,
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
