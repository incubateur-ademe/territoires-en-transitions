'use client';

import { referentielToName } from '@/app/app/labels';
import { makeReferentielUrl } from '@/app/app/paths';
import HeaderLabellisationConnected from '@/app/referentiels/labellisations/HeaderLabellisation';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useEtatLieuxHasStarted } from '@/app/referentiels/use-snapshot';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { ReactNode } from 'react';

export default function Layout({ tabs }: { tabs: ReactNode }) {
  const { hasCollectivitePermission, collectiviteId } =
    useCurrentCollectivite();
  const referentielId = useReferentielId();
  const parcoursLabellisation = useCycleLabellisation(referentielId);

  const { started: etatLieuxHasStarted, isLoading: isLoadingEtatLieux } =
    useEtatLieuxHasStarted(referentielId);

  if (isLoadingEtatLieux) {
    return (
      <>
        <Title referentielId={referentielId} />
        <SpinnerLoader className="m-auto" />
      </>
    );
  }

  // cas particulier : le référentiel n'est pas du tout renseigné
  if (!etatLieuxHasStarted) {
    return (
      <>
        <Title referentielId={referentielId} />
        <div
          data-test={`labellisation-${referentielId}`}
          className="p-12 bg-white"
        >
          <p className="text-center">
            Ce référentiel n’est pas encore renseigné pour votre collectivité.
            Pour commencer à visualiser votre progression, mettez à jour les
            statuts des mesures.
          </p>
          <Button
            className="mx-auto"
            href={makeReferentielUrl({
              collectiviteId,
              referentielId,
            })}
          >
            {hasCollectivitePermission('referentiels.mutate')
              ? 'Mettre à jour le référentiel'
              : 'Voir le référentiel'}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div data-test={`labellisation-${referentielId}`}>
      <Title referentielId={referentielId} />
      <HeaderLabellisationConnected
        parcoursLabellisation={parcoursLabellisation}
      />
      {tabs}
    </div>
  );
}

const Title = ({ referentielId }: { referentielId: ReferentielId }) => (
  <>
    <h1 className="text-center mb-2">Audit et labellisation</h1>
    <p className="text-center text-[22px]">
      Référentiel {referentielToName[referentielId as ReferentielOfIndicateur]}
    </p>
  </>
);
