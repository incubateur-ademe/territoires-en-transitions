import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { useParams } from 'next/navigation';
import { PageHeader } from 'ui/PageHeader';
import { useChangeReponseHandler } from '../PersoPotentielModal/useChangeReponseHandler';
import { ThematiqueQR } from './ThematiqueQR';
import { useCarteIdentite } from './useCarteIdentite';
import { useNextThematiqueId } from './useNextThematiqueId';
import { useQuestionsReponses } from './useQuestionsReponses';
import { useThematique } from './useThematique';

const PersoReferentielThematique = () => {
  const collectivite = useCurrentCollectivite();
  const { collectivite_id, nom } = collectivite || {};
  const { thematiqueId } = useParams<{ thematiqueId: string }>();
  const thematique = useThematique(thematiqueId);
  const qr = useQuestionsReponses({ thematique_id: thematiqueId });
  const nextThematiqueId = useNextThematiqueId(collectivite_id, thematiqueId);
  const identite = useCarteIdentite(collectivite_id);
  const handleChange = useChangeReponseHandler(collectivite_id || null);

  if (!collectivite_id || !thematique) {
    return null;
  }

  return (
    <>
      <PageHeader>
        <h2 className="w-full text-center m-0">{thematique.nom}</h2>
      </PageHeader>
      <main className="fr-container fr-mt-1w fr-mb-4w" data-test="thematique">
        <ThematiqueQR
          collectivite={{ id: collectivite_id, nom: nom || '' }}
          thematique={thematique}
          questionReponses={qr || []}
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
