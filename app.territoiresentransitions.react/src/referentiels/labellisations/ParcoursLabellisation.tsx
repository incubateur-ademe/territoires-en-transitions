import { referentielToName } from '@/app/app/labels';
import { makeCollectiviteReferentielUrl } from '@/app/app/paths';
import {
  useCollectiviteId,
  useReferentielId,
} from '@/app/core-logic/hooks/params';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import HeaderLabellisation from './HeaderLabellisation';
import { LabellisationTabs } from './LabellisationTabs';
import { useCycleLabellisation } from './useCycleLabellisation';
import { useIsUnchangedReferentiel } from './useIsUnchangedReferentiel';

const ParcoursLabellisation = () => {
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
      <PageContainer
        dataTest={`labellisation-${referentielId}`}
        bgColor="white"
        innerContainerClassName="!pt-0"
      >
        <Title referentiel={referentielId} />
        <p className="my-12 text-center">
          Ce référentiel n’est pas encore renseigné pour votre collectivité.
          <br />
          Pour commencer à visualiser votre progression, mettez à jour les
          statuts des actions.
        </p>

        {collectiviteId && referentielId ? (
          <div className="flex justify-center">
            <Button
              href={makeCollectiviteReferentielUrl({
                collectiviteId,
                referentielId,
              })}
            >
              Mettre à jour le référentiel
            </Button>
          </div>
        ) : null}
      </PageContainer>
    );
  }

  return collectiviteId && parcours ? (
    <>
      <Title referentiel={parcours.referentiel} />
      <HeaderLabellisation />
      <PageContainer
        dataTest={`labellisation-${parcours.referentiel}`}
        bgColor="white"
        innerContainerClassName="!pt-0"
      >
        <LabellisationTabs />
      </PageContainer>
    </>
  ) : (
    <div>...</div>
  );
};

const Title = ({ referentiel }: { referentiel: string | null }) => (
  <>
    <h1 className="text-center mt-12 mb-4">Audit et labellisation</h1>
    {referentiel ? (
      <p className="text-center text-[22px]">
        Référentiel {referentielToName[referentiel as ReferentielOfIndicateur]}
      </p>
    ) : null}
  </>
);

export default ParcoursLabellisation;
