'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import {
  makeCollectivitePersoRefThematiqueUrl,
  makeCollectivitePersoRefUrl,
} from '@/app/app/paths';
import { Button, Checkbox } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';

import { usePersonnalisationReferentiels } from '../personnalisation-referentiel.context';
import { QuestionReponseList } from '../PersoPotentielModal/PersoPotentielQR';
import { useChangeReponseHandler } from '../PersoPotentielModal/useChangeReponseHandler';
import { CarteIdentite } from './CarteIdentite';
import { useCarteIdentite } from './useCarteIdentite';
import { useNextThematiqueId } from './useNextThematiqueId';
import { useQuestionsReponses } from './useQuestionsReponses';
import { useThematique } from './useThematique';

export const PersoReferentielThematique = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const { referentiels } = usePersonnalisationReferentiels();
  const { thematiqueId } = useParams<{ thematiqueId: string }>();
  const thematique = useThematique(thematiqueId);
  const qr = useQuestionsReponses({ thematique_id: thematiqueId });
  const nextThematiqueId = useNextThematiqueId(
    collectiviteId,
    referentiels,
    thematiqueId
  );
  const identite = useCarteIdentite(collectiviteId);
  const handleChange = useChangeReponseHandler(collectiviteId, ['cae', 'eci']);

  const [onlyNoResponse, setOnlyNoResponse] = useState(false);

  const qrList = onlyNoResponse
    ? qr.filter(
        ({ reponse }) =>
          reponse === null || reponse === undefined || reponse === ''
      )
    : qr;

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
        <div className="max-w-3xl flex flex-col mx-auto mt-10">
          {/** Identité de la collectivité */}
          {thematiqueId === 'identite' && identite && (
            <>
              <h3>Informations administratives officielles</h3>
              <CarteIdentite identite={identite} />
              <h3 className="mt-6 mb-0">
                Questions pour la personnalisation des référentiels
              </h3>
            </>
          )}
          {/** Liste de questions */}
          <Checkbox
            variant="switch"
            id="onlyNoResponse"
            checked={onlyNoResponse}
            onChange={() => setOnlyNoResponse(!onlyNoResponse)}
            label="Afficher uniquement les questions sans réponse"
            containerClassname="my-10 mx-auto pb-4 border-b border-grey-4"
          />
          <QuestionReponseList
            questionReponses={qrList}
            onChange={handleChange}
          />
          {/** Boutons fin de page retour au sommaire ou thématique suivante */}
          <div className="flex gap-4 pt-8">
            <Button
              variant="outlined"
              size="sm"
              icon="arrow-left-line"
              dataTest="btn-toc"
              href={makeCollectivitePersoRefUrl({ collectiviteId })}
            >
              Revenir au sommaire
            </Button>
            {nextThematiqueId && (
              <Button
                dataTest="btn-next"
                icon="arrow-right-line"
                iconPosition="right"
                size="sm"
                href={makeCollectivitePersoRefThematiqueUrl({
                  collectiviteId,
                  thematiqueId: nextThematiqueId,
                })}
              >
                Afficher la catégorie suivante
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default PersoReferentielThematique;
