/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionScore} from 'types/ClientScore';
import {
  TQuestionReponse,
  TChangeReponse,
} from 'generated/dataLayer/reponse_write';
import {PointsPotentiels} from './PointsPotentiels';
import {reponseParType} from './Reponse';
import {TReponse} from 'generated/dataLayer/reponse_read';

export type TPersoPotentielQRProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
  /** Détail du score associé à l'action */
  actionScore: ActionScore;
  /** Liste des questions/réponses associées à l'action */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

/** Onglet "Personnalisation du potentiel"
 *
 * Affiche le potentiel réduit ou augmenté ainsi que la liste des questions/réponses
 */
export const PersoPotentielQR = (props: TPersoPotentielQRProps) => {
  const {questionReponses} = props;

  return (
    <div data-test="PersoPotentielQR">
      <PointsPotentiels {...props} />
      <h6 className="mt-8 mb-0">
        {questionReponses?.length > 1
          ? 'Caractéristiques liées'
          : 'Caractéristique liée'}
      </h6>
      <QuestionReponseList {...props} />
    </div>
  );
};

export type TQuestionReponseProps = {
  qr: TQuestionReponse;
  onChange: (reponse: TReponse) => void;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const {qr} = props;
  const {type, formulation} = qr;
  const Reponse = reponseParType[type];

  return (
    <>
      <legend
        className="fr-fieldset__legend fr-text--regular pt-6"
        dangerouslySetInnerHTML={{__html: formulation}}
      />
      {/*
    <span className="fr-hint-text">Exemple : contrat de construction</span>
    */}
      <Reponse {...props} />
    </>
  );
};

export type TQuestionReponseListProps = {
  className?: string;
  /** Liste des questions/réponses */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

/** Affiche la liste de questions/réponses */
export const QuestionReponseList = (props: TQuestionReponseListProps) => {
  const {className, questionReponses, onChange} = props;
  return (
    <div className={`fr-form-group ${className || ''}`}>
      {questionReponses.map(qr => {
        const {id} = qr;
        return (
          <fieldset key={id} className="fr-fieldset">
            <QuestionReponse
              qr={qr}
              onChange={(reponse: TReponse) => onChange(id, reponse)}
            />
          </fieldset>
        );
      })}
    </div>
  );
};
