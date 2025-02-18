'use client';

import { referentielToName } from '@/app/app/labels';
import { makeReferentielUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import HeaderLabellisationConnected from '@/app/referentiels/labellisations/HeaderLabellisation';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useIsUnchangedReferentiel } from '@/app/referentiels/labellisations/useIsUnchangedReferentiel';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { ReferentielId } from '@/domain/referentiels';
import PageContainer from '@/ui/components/layout/page-container';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function Layout({ tabs }: { tabs: ReactNode }) {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { parcours } = useCycleLabellisation(referentielId);
  const isUnchangedReferentiel = useIsUnchangedReferentiel(
    collectiviteId,
    referentielId
  );

  // cas particulier : le référentiel n'est pas du tout renseigné
  if (isUnchangedReferentiel) {
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
            statuts des actions.
          </p>

          <div className="flex justify-center">
            <Link
              className="fr-btn fr-btn--secondary "
              href={makeReferentielUrl({
                collectiviteId,
                referentielId,
              })}
            >
              Mettre à jour le référentiel
            </Link>
          </div>
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
        <HeaderLabellisationConnected />
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
    <h1 className="text-center fr-mt-4w fr-mb-1w">Audit et labellisation</h1>
    <p className="text-center text-[22px]">
      Référentiel {referentielToName[referentielId as ReferentielOfIndicateur]}
    </p>
  </>
);
