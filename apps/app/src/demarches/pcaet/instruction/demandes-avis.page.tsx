'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { EmptyCard, PageHeader } from '@tet/ui';

export const DemandesAvisPage = () => {
  const collectivite = useCurrentCollectivite();

  return (
    <div data-test="demarches.pcaet.demandes-avis">
      <PageHeader>
        <PageHeader.Title>{appLabels.instructionTitre}</PageHeader.Title>
      </PageHeader>
      <p className="text-grey-8">
        {appLabels.instructionBienvenue({ nom: collectivite.nom })}
      </p>
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title={appLabels.instructionAVenirTitre}
        description={appLabels.instructionAVenirDescription}
      />
    </div>
  );
};
