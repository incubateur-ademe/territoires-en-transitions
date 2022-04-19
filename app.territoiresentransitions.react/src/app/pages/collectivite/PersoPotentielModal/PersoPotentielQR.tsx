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
import {Accordion} from 'ui/Accordion';

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
  /** vrai quand la question est la 1ère de type proportion */
  hasProportionDescription: boolean;
  onChange: (reponse: TReponse) => void;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const {qr, hasProportionDescription} = props;
  const {id, type, formulation, description} = qr;
  const Reponse = reponseParType[type];

  return (
    <>
      <legend
        className="fr-fieldset__legend fr-text--regular pt-6"
        dangerouslySetInnerHTML={{__html: formulation}}
      />
      {description ? (
        <Accordion
          className="fr-mb-3w"
          id={`accordion-${id}`}
          titre="En savoir plus"
          html={description}
        />
      ) : null}
      <Reponse {...props} />
      {hasProportionDescription ? (
        <Accordion
          className="fr-mt-3w"
          id={`accordion-part-${id}`}
          titre="Comment calculer la part ?"
          html="La part se rapporte au nombre d'habitants (nombre d'habitants de la
          collectivité / nombre d'habitants de la structure compétente) ou au
          pouvoir de la collectivité dans la structure compétente (nombre de voix
          d'élu de la collectivité / nombre de voix total dans l'organe
          délibératoire de la structure compétente) si cette part est supérieure à
          celle liée au nombre d'habitants."
        />
      ) : null}
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
      {questionReponses.map((qr, index) => {
        const {id} = qr;
        return (
          <fieldset key={id} className="fr-fieldset">
            <QuestionReponse
              qr={qr}
              onChange={(reponse: TReponse) => onChange(qr, reponse)}
              hasProportionDescription={hasProportionDescription(
                questionReponses,
                index
              )}
            />
          </fieldset>
        );
      })}
    </div>
  );
};

const hasProportionDescription = (
  questionReponses: TQuestionReponse[],
  index: number
): boolean => {
  const firstProportionIndex = questionReponses.findIndex(
    ({type}) => type === 'proportion'
  );
  return index === firstProportionIndex;
};
