/**
 * Affiche la liste des questions et les éventuelles réponses pour une collectivité
 */

import {useState} from 'react';
import {QuestionReponseList} from '../PersoPotentielModal/PersoPotentielQR';
import {SwitchLabelLeft} from 'ui/shared/SwitchLabelLeft';
import {CarteIdentiteRead} from 'generated/dataLayer/carte_identite_read';
import {TQuestionThematiqueRead} from 'generated/dataLayer/question_thematique_read';
import {
  TChangeReponse,
  TQuestionReponse,
} from 'generated/dataLayer/reponse_write';
import {
  makeCollectivitePersoRefUrl,
  makeCollectivitePersoRefThematiqueUrl,
} from 'app/paths';
import {CarteIdentite} from './CarteIdentite';

export type TThematiqueQRProps = {
  thematique: TQuestionThematiqueRead;
  collectivite: {
    id: number;
    nom: string;
  };
  /** Carte d'identité de la collectivité */
  identite?: CarteIdentiteRead;
  /** Identifiant de la thématique suivante */
  nextThematiqueId?: string | null;
  /** Liste des questions/réponses associées à la thématique */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

export const ThematiqueQR = (props: TThematiqueQRProps) => {
  const {collectivite, identite, nextThematiqueId, questionReponses, onChange} =
    props;
  const [onlyNoResponse, setOnlyNoResponse] = useState(false);

  const qrList = onlyNoResponse
    ? questionReponses.filter(
        ({reponse}) => reponse === null || reponse === undefined
      )
    : questionReponses;

  return (
    <div className="flex flex-col">
      <div className="flex justify-center w-full">
        <SwitchLabelLeft
          id="onlyNoResponse"
          checked={onlyNoResponse}
          className="w-[28rem] mt-6"
          onChange={setOnlyNoResponse}
        >
          Afficher uniquement les questions sans réponse
        </SwitchLabelLeft>
      </div>
      <div className="max-w-3xl self-center mt-10">
        {identite ? (
          <>
            <CarteIdentite identite={identite} />
            <h3 className="fr-mb-0">
              Questions pour la personnalisation des référentiels
            </h3>
          </>
        ) : null}
        <QuestionReponseList questionReponses={qrList} onChange={onChange} />
        <a
          className="fr-btn fr-btn--secondary fr-btn--icon-left fr-fi-arrow-left-line self-start fr-mt-5w"
          href={makeCollectivitePersoRefUrl({collectiviteId: collectivite.id})}
        >
          Revenir au sommaire
        </a>
        {nextThematiqueId ? (
          <a
            className="fr-btn fr-btn--icon-right fr-fi-arrow-right-line self-start fr-mt-5w fr-ml-3w"
            href={makeCollectivitePersoRefThematiqueUrl({
              collectiviteId: collectivite.id,
              thematiqueId: nextThematiqueId,
            })}
          >
            Afficher la catégorie suivante
          </a>
        ) : null}
      </div>
    </div>
  );
};
