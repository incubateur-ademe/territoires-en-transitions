'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import PageContainer from '@/ui/components/layout/page-container';
import { useParams } from 'next/navigation';
import { useChangeReponseHandler } from '../PersoPotentielModal/useChangeReponseHandler';
import { ThematiqueQR } from './ThematiqueQR';
import { useCarteIdentite } from './useCarteIdentite';
import { useNextThematiqueId } from './useNextThematiqueId';
import { useQuestionsReponses } from './useQuestionsReponses';
import { useThematique } from './useThematique';

export const PersoReferentielThematique = () => {
  const { collectiviteId, nom } = useCurrentCollectivite();
  const { thematiqueId } = useParams<{ thematiqueId: string }>();
  const thematique = useThematique(thematiqueId);
  const qr = useQuestionsReponses({ thematique_id: thematiqueId });
  const nextThematiqueId = useNextThematiqueId(collectiviteId, thematiqueId);
  const identite = useCarteIdentite(collectiviteId);
  const handleChange = useChangeReponseHandler(collectiviteId, ['cae', 'eci']);

  if (!thematique) {
    return null;
  }

  return (
    <>
      <h2 className="w-full mb-0 py-9 text-center bg-primary-3">
        {thematique.nom}
      </h2>
      <PageContainer
        dataTest="thematique"
        bgColor="white"
        innerContainerClassName="pt-2"
      >
        <ThematiqueQR
          collectivite={{ id: collectiviteId, nom: nom || '' }}
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
