'use client';

import {
  makeCollectiviteDemarchePcaetDetailUrl,
} from '@/app/app/paths';
import { VulnerabiliteTable } from '@/app/demarches/pcaet/components/vulnerabilite-table';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Alert, Breadcrumbs, Button, Divider } from '@tet/ui';
import { notFound } from 'next/navigation';

type Props = {
  demarcheId: string;
};

export const VulnerabiliteTerritoirePage = ({ demarcheId }: Props) => {
  const { demarche, update, collectiviteId } = useDemarchePcaet(demarcheId);
  const { setToast } = useToastContext();

  if (!demarche) {
    notFound();
  }

  const isPublished = demarche.statutPublication === 'publie';
  const isComplete = demarche.volets.vulnerabilite_territoire === 'complete';
  const hasBeenValidated = Boolean(demarche.vulnerabiliteValideeLe);
  const isModifiedAfterValidation = !isComplete && hasBeenValidated;

  const handleValidate = () => {
    update({
      volets: { ...demarche.volets, vulnerabilite_territoire: 'complete' },
      vulnerabiliteValideeLe: new Date().toISOString(),
    });
    setToast(
      'success',
      'Saisie de vulnérabilité validée. Le tableau de bord est à jour.'
    );
  };

  const handleVulnerabiliteChange = (
    vulnerabilite: typeof demarche.vulnerabilite
  ) => {
    update({
      vulnerabilite,
      volets: { ...demarche.volets, vulnerabilite_territoire: 'incomplete' },
    });
  };

  return (
    <div
      className="flex flex-col gap-4 pb-12"
      data-test="VulnerabiliteTerritoirePage"
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-primary-9 mb-0">Vulnérabilité du territoire</h1>
          <Button
            size="sm"
            disabled={isComplete || isPublished}
            onClick={handleValidate}
            icon={isComplete ? 'check-line' : undefined}
          >
            {isComplete ? 'Saisie terminée' : 'Marquer comme terminé'}
          </Button>
        </div>

        <Breadcrumbs
          items={[
            {
              label: demarche.titre,
              href: makeCollectiviteDemarchePcaetDetailUrl({
                collectiviteId,
                demarchePcaetId: demarche.id,
              }),
            },
            { label: 'Vulnérabilité du territoire' },
          ]}
        />

        <Divider color="primary" className="my-3" />
      </div>

      <p className="text-sm text-grey-7 m-0">
        Évaluez le niveau de vulnérabilité du territoire pour chaque domaine,
        aux horizons actuel, 2050 et 2100, puis décrivez les objectifs associés.
      </p>

      {isModifiedAfterValidation && (
        <Alert
          state="warning"
          title="Modifications détectées"
          description="La saisie a été modifiée depuis la dernière validation. Pensez à la revalider pour mettre à jour le tableau de bord."
        />
      )}

      <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
        <VulnerabiliteTable
          value={demarche.vulnerabilite}
          isReadonly={isPublished}
          onChange={handleVulnerabiliteChange}
        />
      </div>
    </div>
  );
};
