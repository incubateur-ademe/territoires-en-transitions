import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { PageContainer } from '@/app/ui/layout/page-layout';
import { useParams } from 'react-router-dom';
import { useChangeReponseHandler } from '../PersoPotentielModal/useChangeReponseHandler';
import { ThematiqueQR } from './ThematiqueQR';
import { useCarteIdentite } from './useCarteIdentite';
import { useNextThematiqueId } from './useNextThematiqueId';
import { useQuestionsReponses } from './useQuestionsReponses';
import { useThematique } from './useThematique';

const PersoReferentielThematique = () => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId: collectivite_id, nom } = collectivite || {};
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
      <h2 className="w-full mb-0 py-9 text-center bg-bf925">
        {thematique.nom}
      </h2>
      <PageContainer dataTest="thematique" className="mt-2 mb-8">
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
      </PageContainer>
    </>
  );
};

export default PersoReferentielThematique;
