import { Statut, StatutEnum } from '../statut.enum.schema';

export const JAUGE_MIN = 0;
export const JAUGE_MAX = 100;
export const JAUGE_STEP = 5;
const JAUGE_ON_LEAVING_REALISE = 95;

const statutsFigeantJauge = [
  StatutEnum.ABANDONNE,
  StatutEnum.EN_PAUSE,
  StatutEnum.BLOQUE,
] as const;
export type StatutFigeantJauge = (typeof statutsFigeantJauge)[number];

const statutsResumingFromRealise: Statut[] = [
  StatutEnum.EN_COURS,
  StatutEnum.EN_RETARD,
  StatutEnum.A_DISCUTER,
];

export const jaugeStatutErrors = [
  'JAUGE_INVALIDE',
  'JAUGE_FIGEE',
  'SOUS_ACTION_SANS_JAUGE',
] as const;
export type JaugeStatutError = (typeof jaugeStatutErrors)[number];

export type JaugeStatut = {
  statut: Statut | null;
  jauge: number;
};

type JaugeStatutResult =
  | { success: true; data: JaugeStatut }
  | { success: false; error: JaugeStatutError };

export const isJaugeFigee = (
  statut: Statut | null
): statut is StatutFigeantJauge =>
  statutsFigeantJauge.some((statutFigeant) => statutFigeant === statut);

export const isValidJauge = (jauge: number): boolean =>
  Number.isInteger(jauge) &&
  jauge >= JAUGE_MIN &&
  jauge <= JAUGE_MAX &&
  jauge % JAUGE_STEP === 0;

const getJaugeAfterStatutChange = (
  before: JaugeStatut,
  statut: Statut | null
): number => {
  if (statut === StatutEnum.A_VENIR) return JAUGE_MIN;
  if (statut === StatutEnum.REALISE) return JAUGE_MAX;
  if (
    before.statut === StatutEnum.REALISE &&
    statut !== null &&
    statutsResumingFromRealise.includes(statut)
  ) {
    return JAUGE_ON_LEAVING_REALISE;
  }
  return before.jauge;
};

const getStatutAfterJaugeChange = (
  statut: Statut | null,
  jauge: number
): Statut | null => {
  if (jauge === JAUGE_MAX) return StatutEnum.REALISE;
  if (statut === StatutEnum.REALISE) return StatutEnum.EN_COURS;
  if (statut === StatutEnum.A_VENIR && jauge > JAUGE_MIN) {
    return StatutEnum.EN_COURS;
  }
  return statut;
};

export const applyJaugeStatutChange = ({
  before,
  change,
  isSousAction,
}: {
  before: JaugeStatut;
  change: Partial<JaugeStatut>;
  isSousAction: boolean;
}): JaugeStatutResult => {
  const isJaugeChanged =
    change.jauge !== undefined && change.jauge !== before.jauge;

  if (isSousAction) {
    return isJaugeChanged
      ? { success: false, error: 'SOUS_ACTION_SANS_JAUGE' }
      : {
          success: true,
          data: {
            statut: change.statut !== undefined ? change.statut : before.statut,
            jauge: before.jauge,
          },
        };
  }

  if (change.jauge !== undefined && !isValidJauge(change.jauge)) {
    return { success: false, error: 'JAUGE_INVALIDE' };
  }

  if (change.statut !== undefined && change.statut !== before.statut) {
    return {
      success: true,
      data: {
        statut: change.statut,
        jauge: getJaugeAfterStatutChange(before, change.statut),
      },
    };
  }

  if (change.jauge === undefined || !isJaugeChanged) {
    return { success: true, data: before };
  }

  if (isJaugeFigee(before.statut)) {
    return { success: false, error: 'JAUGE_FIGEE' };
  }

  return {
    success: true,
    data: {
      statut: getStatutAfterJaugeChange(before.statut, change.jauge),
      jauge: change.jauge,
    },
  };
};

export const getJaugeAtCreation = ({
  statut,
  isSousAction,
}: {
  statut: Statut | null | undefined;
  isSousAction: boolean;
}): number =>
  !isSousAction && statut === StatutEnum.REALISE ? JAUGE_MAX : JAUGE_MIN;
