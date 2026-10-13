'use client';

import { appLabels } from '@/app/labels/catalog';
import { getSectionDeRegle } from './regles.sections';
import { useRegleOuverte } from './use-regle-ouverte';

export const RegleLink = ({ numero }: { numero?: number | null }) => {
  const [, setRegle] = useRegleOuverte();
  if (!numero) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => setRegle(numero)}
      data-test={`admin.reprise-tec.regle-${numero}`}
      className="ml-1 rounded-sm text-xs font-medium text-primary-9 underline underline-offset-2 hover:text-primary-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-7"
      title={appLabels.repriseTecRegleDe(
        numero,
        getSectionDeRegle(numero)?.titre ?? ''
      )}
    >
      {appLabels.repriseTecSection(numero)}
    </button>
  );
};
