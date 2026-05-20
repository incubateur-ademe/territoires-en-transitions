import { appLabels } from '@/app/labels/catalog';

type FormatReponseAttendueInput = {
  formulation: string;
  minRealisePercentage: number;
  minProgrammePercentage: number | null;
};

export const formatReponseAttendue = ({
  formulation,
  minRealisePercentage,
  minProgrammePercentage,
}: FormatReponseAttendueInput): string => {
  const normalisee = formulation.toLowerCase();
  if (normalisee.startsWith('identifier')) {
    return appLabels.reponseAvoirPersonneRenseignee;
  }
  if (normalisee.startsWith('être en conformité')) {
    return appLabels.reponseAvoirStatutFaitOuProgramme;
  }
  if (minRealisePercentage === 100 && minProgrammePercentage === null) {
    return appLabels.reponseAvoirStatutFait;
  }
  if (minProgrammePercentage === 100) {
    return appLabels.reponseAvoirStatutFaitOuProgramme;
  }
  return appLabels.reponsePourcentageFaitMinimum({
    percent: minRealisePercentage,
  });
};
