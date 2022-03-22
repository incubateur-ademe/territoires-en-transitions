/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import {FormEventHandler} from 'react';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionScore} from 'types/ClientScore';
import {TReponse} from 'generated/dataLayer/reponse_read';
import {TQuestionReponse} from 'generated/dataLayer/reponse_write';
import {PointsPotentiels} from './PointsPotentiels';
import {traiteChgtReponseParType, reponseParType} from './Reponse';

type TChangeReponse = (newValue: TReponse) => void;

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
  const {questionReponses, onChange} = props;

  const handleChange: FormEventHandler<HTMLFieldSetElement> = e => {
    const {name} = e.target as HTMLInputElement;
    const traiteChgt = traiteChgtReponseParType[name];
    if (traiteChgt) {
      onChange(traiteChgt(e));
    }
  };

  return (
    <div data-test="PersoPotentielQR">
      <PointsPotentiels {...props} />
      <h6 className="mt-8">Caractéristique liée</h6>
      <div className="fr-form-group">
        {questionReponses.map(qr => (
          <fieldset
            key={qr.id}
            name={qr.type}
            className="fr-fieldset"
            onChange={handleChange}
          >
            <QuestionReponse qr={qr} />
          </fieldset>
        ))}
      </div>
    </div>
  );
};

export type TQuestionReponseProps = {
  qr: TQuestionReponse;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const {qr} = props;
  const {type, formulation} = qr;
  const Reponse = reponseParType[type];

  return (
    <>
      <legend
        className="fr-fieldset__legend fr-text--regular"
        dangerouslySetInnerHTML={{__html: formulation}}
      />
      {/*
    <span className="fr-hint-text">Exemple : contrat de construction</span>
    */}
      <Reponse {...props} />
    </>
  );
};
