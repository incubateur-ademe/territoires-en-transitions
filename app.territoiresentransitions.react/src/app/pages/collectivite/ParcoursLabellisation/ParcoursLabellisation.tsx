import {useCollectiviteId} from 'core-logic/hooks/params';
import {observer} from 'mobx-react-lite';
import {referentielToName} from 'app/labels';
import {CriteresLabellisation} from './CriteresLabellisation';
import {useDemandeLabellisation} from './useDemandeLabellisation';
import {usePreuves} from './usePreuves';
import {useParcoursLabellisation} from './useParcoursLabellisation';
import {Header} from './Header';

export default observer(() => {
  const collectiviteId = useCollectiviteId();
  const parcours = useParcoursLabellisation();
  const demande = useDemandeLabellisation(parcours);
  const preuves = usePreuves(demande?.id);

  return collectiviteId && demande && parcours ? (
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
});
