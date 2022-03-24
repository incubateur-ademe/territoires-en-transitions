/**
 * Affiche la liste des questions et les éventuelles réponses pour une collectivité
 */

import {useState} from 'react';
import {QuestionReponseList} from '../PersoPotentielModal/PersoPotentielQR';
import {SwitchLabelLeft} from '../../../../ui/shared/SwitchLabelLeft';
import {
  TChangeReponse,
  TQuestionReponse,
} from 'generated/dataLayer/reponse_write';
import {makeCollectivitePersoRefUrl} from 'app/paths';

export type TThematiqueQRProps = {
  thematique: {
    id: number;
    nom: string;
  };
  collectivite: {
    id: number;
    nom: string;
  };
  /** Liste des questions/réponses associées à la thématique */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

export const ThematiqueQR = (props: TThematiqueQRProps) => {
  const {collectivite, thematique, questionReponses, onChange} = props;
  const [onlyNoResponse, setOnlyNoResponse] = useState(false);

  const qrList = onlyNoResponse
    ? questionReponses.filter(
        ({reponse}) => reponse === null || reponse === undefined
      )
    : questionReponses;

  return (
    <div className="flex flex-col">
      <div className="bg-bf925 w-full h-28 flex items-center">
        <h2 className="w-full text-center m-0">{thematique.nom}</h2>
        <span className="min-w-max absolute right-10 lg:right-20 pt-2">
          {collectivite.nom}
        </span>
      </div>
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
        <QuestionReponseList questionReponses={qrList} onChange={onChange} />
        <a
          className="fr-btn fr-btn--icon-left fr-fi-arrow-left-line self-start mt-10"
          href={makeCollectivitePersoRefUrl({collectivite_id: collectivite.id})}
        >
          Revenir au sommaire
        </a>
      </div>
    </div>
  );
};
