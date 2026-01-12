import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplateTexts = [
  'txt_axe_no_fiche_info',
  'txt_fiche_fill_missing_info_link',
  'txt_fiche_statut_',
  'txt_fiche_indicateur_no_data_',
  'txt_fiche_statut_EN_COURS',
  'txt_fiche_statut_REALISE',
  'txt_fiche_statut_A_VENIR',
  'txt_fiche_statut_ABANDONNE',
  'txt_fiche_statut_BLOQUE',
  'txt_fiche_statut_EN_RETARD',
  'txt_fiche_statut_A_DISCUTER',
  'txt_fiche_statut_SANS_STATUT',
] as const;

export type ReportTemplateTextsType = (typeof ReportTemplateTexts)[number];

export const ReportTemplateTextsEnum = createEnumObject(ReportTemplateTexts);
