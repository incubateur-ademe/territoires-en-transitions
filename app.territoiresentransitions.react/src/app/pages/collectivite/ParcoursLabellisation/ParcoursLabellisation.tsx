import {Link} from 'react-router-dom';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {referentielToName} from 'app/labels';
import {usePreuves} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {useParcoursLabellisation} from './useParcoursLabellisation';
import {HeaderLabellisation} from './HeaderLabellisation';
import {ReferentielOfIndicateur} from 'types/litterals';
import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {LabellisationTabs} from './LabellisationTabs';

const ParcoursLabellisation = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();
  const {parcours, demande} = useParcoursLabellisation(referentiel);
  const preuves = usePreuves({
    demande_id: demande?.id,
  }) as TPreuveLabellisation[];

  // cas particulier : le référentiel n'est pas du tout renseigné
  if (!parcours) {
    return (
      <>
        <Title referentiel={referentiel} />
        <main className="fr-container mt-9 mb-16">
          <p>
            Ce référentiel n’est pas encore renseigné pour votre collectivité.
            Pour commencer à visualiser votre progression, mettez à jour les
            statuts des actions.
          </p>

          {collectiviteId && referentiel ? (
            <div className="flex justify-center">
              <Link
                className="fr-btn fr-btn--secondary "
                to={makeCollectiviteReferentielUrl({
                  collectiviteId,
                  referentielId: referentiel as ReferentielParamOption,
                })}
              >
                Mettre à jour le référentiel
              </Link>
            </div>
          ) : null}
        </main>
      </>
    );
  }

  return collectiviteId && parcours ? (
    <>
      <Title referentiel={parcours.referentiel} />
      <HeaderLabellisation
        parcours={parcours}
        demande={demande}
        preuves={preuves}
      />
      <main
        className="fr-container mt-9 mb-16"
        data-test={`labellisation-${parcours.referentiel}`}
      >
        <LabellisationTabs />
      </main>
    </>
  ) : (
    <div>...</div>
  );
};

const Title = ({referentiel}: {referentiel: string | null}) => (
  <>
    <h1 className="text-center fr-mt-4w fr-mb-1w">Audit et labellisation</h1>
    {referentiel ? (
      <p className="text-center text-[22px]">
        Référentiel {referentielToName[referentiel as ReferentielOfIndicateur]}
      </p>
    ) : null}
  </>
);

export default ParcoursLabellisation;
