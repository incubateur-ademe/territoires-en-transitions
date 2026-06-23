type FormatReponseAttendueInput = {
  formulation: string;
  minRealisePercentage: number;
  minProgrammePercentage: number | null;
};

export type ReponseAttendue =
  | { kind: 'personne-renseignee' }
  | { kind: 'statut-fait' }
  | { kind: 'statut-fait-ou-programme' }
  | { kind: 'pourcentage-fait-minimum'; percent: number };

export const formatReponseAttendue = ({
  formulation,
  minRealisePercentage,
  minProgrammePercentage,
}: FormatReponseAttendueInput): ReponseAttendue => {
  const normalisee = formulation.toLowerCase();
  if (normalisee.startsWith('identifier')) {
    return { kind: 'personne-renseignee' };
  }
  if (normalisee.startsWith('être en conformité')) {
    return { kind: 'statut-fait-ou-programme' };
  }
  if (minRealisePercentage === 100 && minProgrammePercentage === null) {
    return { kind: 'statut-fait' };
  }
  if (minProgrammePercentage === 100) {
    return { kind: 'statut-fait-ou-programme' };
  }
  return { kind: 'pourcentage-fait-minimum', percent: minRealisePercentage };
};
