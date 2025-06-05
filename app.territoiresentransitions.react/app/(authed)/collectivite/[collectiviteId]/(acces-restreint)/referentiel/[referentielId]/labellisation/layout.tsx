'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielUrl } from '@/app/app/paths';
import HeaderLabellisationConnected from '@/app/referentiels/labellisations/HeaderLabellisation';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useEtatLieuxHasStarted } from '@/app/referentiels/use-snapshot';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReferentielId } from '@/domain/referentiels';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { ReactNode } from 'react';

export default function Layout({ tabs }: { tabs: ReactNode }) {
  const { isReadOnly, collectiviteId } = useCurrentCollectivite();
  const referentielId = useReferentielId();
  const parcoursLabellisation = useCycleLabellisation(referentielId);
  const { parcours } = parcoursLabellisation;

  const { started: etatLieuxHasStarted, isLoading } =
    useEtatLieuxHasStarted(referentielId);

  if (isLoading) {
    return (
      <>
        <Title referentielId={referentielId} />
        <PageContainer
          dataTest={`labellisation-${referentielId}`}
          bgColor="white"
          innerContainerClassName="pt-8 pb-16"
        >
          <div className="flex justify-center items-center h-[calc(100vh-400px)]">
            <SpinnerLoader className="w-8 h-8" />
          </div>
        </PageContainer>
      </>
    );
  }

  // cas particulier : le référentiel n'est pas du tout renseigné
  if (!etatLieuxHasStarted) {
    return (
      <>
        <Title referentielId={referentielId} />
        <PageContainer
          dataTest={`labellisation-${referentielId}`}
          bgColor="white"
          innerContainerClassName="pt-8 pb-16"
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
            {isReadOnly
              ? 'Voir le référentiel'
              : 'Mettre à jour le référentiel'}
          </Button>
        </PageContainer>
      </>
    );
  }

  if (!parcours) {
    return <div>...</div>;
  }

  return (
    <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
      <div className="m-auto xl:max-w-[90rem] 2xl:px-6">
        <Title referentielId={parcours.referentiel} />
        <HeaderLabellisationConnected
          parcoursLabellisation={parcoursLabellisation}
        />
        <PageContainer
          dataTest={`labellisation-${parcours.referentiel}`}
          bgColor="white"
          innerContainerClassName="!pt-0"
        >
          {tabs}
        </PageContainer>
      </div>
    </div>
  );
}

const Title = ({ referentielId }: { referentielId: ReferentielId }) => (
  <>
    <h1 className="text-center mt-8 mb-2">Audit et labellisation</h1>
    <p className="text-center text-[22px]">
      Référentiel {referentielToName[referentielId as ReferentielOfIndicateur]}
    </p>
  </>
);
