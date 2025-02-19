/**
 * Affiche la liste des questions et les éventuelles réponses pour une collectivité
 */

import {
  makeCollectivitePersoRefThematiqueUrl,
  makeCollectivitePersoRefUrl,
} from '@/app/app/paths';
import {
  TChangeReponse,
  TQuestionReponse,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import { Button, Checkbox } from '@/ui';
import { useState } from 'react';
import { QuestionReponseList } from '../PersoPotentielModal/PersoPotentielQR';
import { usePersoFilters } from '../PersoReferentiel/usePersoFilters';
import { CarteIdentite } from './CarteIdentite';
import { TCarteIdentite } from './useCarteIdentite';
import { TQuestionThematiqueRead } from './useThematique';

export type TThematiqueQRProps = {
  thematique: TQuestionThematiqueRead;
  collectivite: {
    id: number;
    nom: string;
  };
  /** Carte d'identité de la collectivité */
  identite?: TCarteIdentite;
  /** Identifiant de la thématique suivante */
  nextThematiqueId?: string | null;
  /** Liste des questions/réponses associées à la thématique */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

export const ThematiqueQR = (props: TThematiqueQRProps) => {
  const {
    collectivite,
    identite,
    nextThematiqueId,
    questionReponses,
    onChange,
  } = props;
  const [onlyNoResponse, setOnlyNoResponse] = useState(false);
  const [{ referentiels }] = usePersoFilters();

  const qrList = onlyNoResponse
    ? questionReponses.filter(
        ({ reponse }) =>
          reponse === null || reponse === undefined || reponse === ''
      )
    : questionReponses;

  return (
    <div className="flex flex-col">
      <Checkbox
        variant="switch"
        id="onlyNoResponse"
        checked={onlyNoResponse}
        onChange={() => setOnlyNoResponse(!onlyNoResponse)}
        label="Afficher uniquement les questions sans réponse"
        containerClassname="mt-6 mx-auto pb-4 border-b border-grey-4"
      />
      <div className="max-w-3xl self-center mt-10">
        {identite ? (
          <>
            <CarteIdentite identite={identite} />
            <h3>Questions pour la personnalisation des référentiels</h3>
          </>
        ) : null}
        <QuestionReponseList questionReponses={qrList} onChange={onChange} />
        <div className="flex gap-4 pt-8">
          <Button
            variant="outlined"
            size="sm"
            icon="arrow-left-line"
            dataTest="btn-toc"
            href={makeCollectivitePersoRefUrl({
              collectiviteId: collectivite.id,
              referentiels,
            })}
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
                collectiviteId: collectivite.id,
                thematiqueId: nextThematiqueId,
                referentiels,
              })}
            >
              Afficher la catégorie suivante
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
