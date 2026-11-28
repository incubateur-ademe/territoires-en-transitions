import { createEnumObject } from '@tet/domain/utils';

export const ReportTemplateGroups = [
  'grp_fiche_missing_info',
  'grp_fiche_indicateur_chart_',
  'grp_sous_action_',
] as const;

export type ReportTemplateGroupsType = (typeof ReportTemplateGroups)[number];

export const ReportTemplateGroupsEnum = createEnumObject(ReportTemplateGroups);
