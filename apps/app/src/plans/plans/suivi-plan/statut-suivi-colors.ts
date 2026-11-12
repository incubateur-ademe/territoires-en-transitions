import { statutFicheActionToColor } from '@/app/plans/fiches/utils';
import { SANS_STATUT_LABEL, Statut, StatutEnum } from '@tet/domain/plans';
import { preset } from '@tet/ui';

const { primary, info, success, error, secondary, grey } =
  preset.theme.extend.colors;

export const COULEURS_SUIVI_BY_STATUT: Record<
  Statut | typeof SANS_STATUT_LABEL,
  string
> = {
  [StatutEnum.A_VENIR]: primary[5],
  [StatutEnum.A_DISCUTER]: statutFicheActionToColor[StatutEnum.A_DISCUTER],
  [StatutEnum.EN_COURS]: info[1],
  [StatutEnum.REALISE]: success[1],
  [StatutEnum.EN_RETARD]: error[1],
  [StatutEnum.EN_PAUSE]: secondary[1],
  [StatutEnum.BLOQUE]: preset.theme.extend.colors['orange-1'],
  [StatutEnum.ABANDONNE]: grey[6],
  [SANS_STATUT_LABEL]: statutFicheActionToColor[SANS_STATUT_LABEL],
};

export const ORDRE_STATUTS: (Statut | null)[] = [
  StatutEnum.A_VENIR,
  StatutEnum.A_DISCUTER,
  StatutEnum.EN_COURS,
  StatutEnum.REALISE,
  StatutEnum.EN_RETARD,
  StatutEnum.EN_PAUSE,
  StatutEnum.BLOQUE,
  StatutEnum.ABANDONNE,
  null,
];
