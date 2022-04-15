import {observer} from 'mobx-react-lite';
import {useParams} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {ThematiqueQR} from './ThematiqueQR';
import {useThematique} from './useThematique';
import {useThematiqueQR} from './useThematiqueQR';
import {useChangeReponseHandler} from '../PersoPotentielModal/useChangeReponseHandler';

export default observer(() => {
  const collectivite = currentCollectiviteBloc.currentCollectivite;
  const {collectivite_id, nom} = collectivite || {};
  const {thematiqueId} = useParams<{thematiqueId: string | undefined}>();
  const thematique = useThematique(thematiqueId);
  const [qr, refetch] = useThematiqueQR(collectivite_id, thematiqueId);
  const [handleChange, renderToast] = useChangeReponseHandler(
    collectivite_id || null,
    refetch
  );

  if (!collectivite_id || !thematique) {
    return null;
  }

  return (
    <>
      <div className="bg-bf925 w-full h-28 flex items-center fr-mt-4w">
        <h2 className="w-full text-center m-0">{thematique.nom}</h2>
      </div>
      <main className="fr-container fr-mt-1w fr-mb-4w">
        <ThematiqueQR
          collectivite={{id: collectivite_id, nom: nom || ''}}
          thematique={thematique}
          questionReponses={qr}
          onChange={handleChange}
        />
        {renderToast()}
      </main>
    </>
  );
});
