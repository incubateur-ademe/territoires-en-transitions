import {observer} from 'mobx-react-lite';
import {useParams} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {ThematiqueQR} from './ThematiqueQR';
import {useThematique} from './useThematique';
import {useThematiqueQR} from './useThematiqueQR';
import {useChangeReponseHandler} from '../PersoPotentielModal/useChangeReponseHandler';
import {useNextThematiqueId} from './useNextThematiqueId';
import {useCarteIdentite} from './useCarteIdentite';

export default observer(() => {
  const collectivite = currentCollectiviteBloc.currentCollectivite;
  const {collectivite_id, nom} = collectivite || {};
  const {thematiqueId} = useParams<{thematiqueId: string | undefined}>();
  const thematique = useThematique(thematiqueId);
  const [qr, refetch] = useThematiqueQR(collectivite_id, thematiqueId);
  const nextThematiqueId = useNextThematiqueId(collectivite_id, thematiqueId);
  const identite = useCarteIdentite(collectivite_id);
  const [handleChange, renderToast] = useChangeReponseHandler(
    collectivite_id || null,
    refetch
  );

  if (!collectivite_id || !thematique) {
    return null;
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-bf925 w-full h-28 flex items-center fr-mt-4w">
        <h2 className="w-full text-center m-0">{thematique.nom}</h2>
      </div>
      <main className="fr-container fr-mt-1w fr-mb-4w">
        <ThematiqueQR
          collectivite={{id: collectivite_id, nom: nom || ''}}
          thematique={thematique}
          questionReponses={qr}
          nextThematiqueId={nextThematiqueId}
          identite={
            thematiqueId === 'identite' ? identite || undefined : undefined
          }
          onChange={handleChange}
        />
        {renderToast()}
      </main>
    </>
  );
});
