import {Link} from 'react-router-dom';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {referentielToName} from 'app/labels';
import {CriteresLabellisation} from './CriteresLabellisation';
import {usePreuves} from './usePreuves';
import {useParcoursLabellisation} from './useParcoursLabellisation';
import {Header} from './Header';
import {ReferentielOfIndicateur} from 'types/litterals';
import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
} from 'app/paths';

const ParcoursLabellisation = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();
  const {parcours, demande} = useParcoursLabellisation(referentiel);
  const preuves = usePreuves(demande?.id);

  // cas particulier : le référentiel n'est pas du tout renseigné
  if (!parcours) {
    return (
      <>
        <h1 className="text-center fr-mt-4w fr-mb-1w">
          Parcours de labellisation
        </h1>
        {referentiel ? (
          <p className="text-center text-[22px]">
            Référentiel{' '}
            {referentielToName[referentiel as ReferentielOfIndicateur]}
          </p>
        ) : null}
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
      <h1 className="text-center fr-mt-4w fr-mb-1w">
        Parcours de labellisation
      </h1>
      <p className="text-center text-[22px]">
        Référentiel {referentielToName[parcours.referentiel]}
      </p>
      <Header parcours={parcours} demande={demande} preuves={preuves} />
      <main className="fr-container mt-9 mb-16">
        <CriteresLabellisation
          collectiviteId={collectiviteId}
          parcours={parcours}
          demande={demande}
          preuves={preuves}
        />
        {/*parcours.referentiel === 'cae' ? (
          <>
            <h2 className="fr-mt-4w">Calendrier de labellisation</h2>
            <p>{parcours.calendrier}</p>
          </>
        ) : null*/}
      </main>
    </>
  ) : (
    <div>...</div>
  );
};

export default ParcoursLabellisation;
