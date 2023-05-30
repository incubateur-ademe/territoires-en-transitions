/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import DOMPurify from 'dompurify';
import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionScore} from 'types/ClientScore';
import {
  TQuestionReponse,
  TReponse,
  TChangeReponse,
} from 'types/personnalisation';
import {PointsPotentiels} from './PointsPotentiels';
import {reponseParType} from './Reponse';
import {Accordion} from 'ui/Accordion';
import {YellowHighlight} from 'ui/Highlight';
import {Justification} from './Justification';

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
  return (
    <div data-test="PersoPotentielQR">
      <YellowHighlight>
        <PointsPotentiels {...props} />
      </YellowHighlight>
      <QuestionReponseList {...props} variant="modal" />
    </div>
  );
};

export type TQuestionReponseProps = {
  qr: TQuestionReponse;
  /** vrai quand la question est la 1ère de type proportion */
  hasProportionDescription: boolean;
  onChange: (reponse: TReponse) => void;
  /** Variante suivant que la liste est affichée dans une page Personnalisation
   * ou dans la modale de personnalisation (depuis une action) */
  variant?: 'modal' | undefined;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const {qr, hasProportionDescription, variant} = props;
  const {id, type, formulation, description} = qr;
  const Reponse = reponseParType[type];

  return (
    <div
      className={classNames({
        'border rounded-md fr-p-2w fr-mb-1w': variant !== 'modal',
        'fr-my-2w': variant === 'modal',
      })}
    >
      <legend
        className={classNames(
          'fr-fieldset__legend fr-fieldset__legend--regular',
          {
            '!font-bold fr-text--lg': variant === 'modal',
          }
        )}
        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(formulation)}}
      />
      <div className="fr-pl-2w">
        {description ? (
          <Accordion
            className="fr-mb-3w"
            id={`accordion-${id}`}
            titre="En savoir plus"
            html={description}
            icon="fr-fi-information-fill"
          />
        ) : null}
        <Reponse {...props} />
        <Justification {...props} />
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
            icon="fr-fi-information-fill"
          />
        ) : null}
      </div>
    </div>
  );
};

export type TQuestionReponseListProps = {
  className?: string;
  /** Liste des questions/réponses */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
  /** Variante suivant que la liste est affichée dans une page Personnalisation
   * ou dans la modale de personnalisation (depuis une action) */
  variant?: 'modal' | undefined;
};

/** Affiche la liste de questions/réponses */
export const QuestionReponseList = (props: TQuestionReponseListProps) => {
  const {className, questionReponses, variant, onChange} = props;
  return (
    <div className={classNames('fr-form-group', className)}>
      {questionReponses.map((qr, index) => {
        const {id} = qr;
        return (
          <fieldset key={id} className="fr-fieldset !flex-col !items-stretch">
            <QuestionReponse
              qr={qr}
              variant={variant}
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
