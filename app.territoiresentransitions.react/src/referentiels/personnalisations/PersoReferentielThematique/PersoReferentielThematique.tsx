'use client';

import { useCollectiviteId } from '@/api/collectivites';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PageContainer from '@/ui/components/layout/page-container';
import { useParams } from 'next/navigation';
import { useChangeReponseHandler } from '../PersoPotentielModal/useChangeReponseHandler';
import { ThematiqueQR } from './ThematiqueQR';
import { useCarteIdentite } from './useCarteIdentite';
import { useNextThematiqueId } from './useNextThematiqueId';
import { useQuestionsReponses } from './useQuestionsReponses';
import { useThematique } from './useThematique';

export const PersoReferentielThematique = () => {
  const collectivite_id = useCollectiviteId();
  const collectivite = useCurrentCollectivite();
  const { nom } = collectivite || {};
  const { thematiqueId } = useParams<{ thematiqueId: string }>();
  const thematique = useThematique(thematiqueId);
  const qr = useQuestionsReponses({ thematique_id: thematiqueId });
  const nextThematiqueId = useNextThematiqueId(collectivite_id, thematiqueId);
  const identite = useCarteIdentite(collectivite_id);
  const handleChange = useChangeReponseHandler(collectivite_id, ['cae', 'eci']);

  if (!collectivite_id || !thematique) {
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
