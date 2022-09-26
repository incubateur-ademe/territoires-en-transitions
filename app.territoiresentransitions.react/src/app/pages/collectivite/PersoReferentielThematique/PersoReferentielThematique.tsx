import {useParams} from 'react-router-dom';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {PageHeader} from 'ui/PageHeader';
import {ThematiqueQR} from './ThematiqueQR';
import {useThematique} from './useThematique';
import {useThematiqueQR} from './useThematiqueQR';
import {useChangeReponseHandler} from '../PersoPotentielModal/useChangeReponseHandler';
import {useNextThematiqueId} from './useNextThematiqueId';
import {useCarteIdentite} from './useCarteIdentite';

const PersoReferentielThematique = () => {
  const collectivite = useCurrentCollectivite();
  const {collectivite_id, nom} = collectivite || {};
  const {thematiqueId} = useParams<{thematiqueId: string | undefined}>();
  const thematique = useThematique(thematiqueId);
  const [qr, refetch] = useThematiqueQR(collectivite_id, thematiqueId);
  const nextThematiqueId = useNextThematiqueId(collectivite_id, thematiqueId);
  const identite = useCarteIdentite(collectivite_id);
  const [handleChange] = useChangeReponseHandler(
    collectivite_id || null,
    refetch
  );

  if (!collectivite_id || !thematique) {
    return null;
  }

  return (
    <>
      <PageHeader>
        <h2 className="w-full text-center m-0">{thematique.nom}</h2>
      </PageHeader>
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
      </main>
    </>
  );
};

export default PersoReferentielThematique;
