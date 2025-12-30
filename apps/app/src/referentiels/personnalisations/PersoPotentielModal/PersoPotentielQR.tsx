/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import {
  TChangeReponse,
  TQuestionReponse,
  TReponse,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { Accordion } from '@tet/ui';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { Justification } from './Justification';
import { PointsPotentiels } from './points-potentiels.label';
import { reponseParType } from './Reponse';

export type TPersoPotentielQRProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
  /** Liste des questions/réponses associées à l'action */
  questionReponses: TQuestionReponse[];
  /** Fonction appelée quand une réponse est modifiée */
  onChange: TChangeReponse;
};

/** Onglet "Personnalisation du potentiel"
 *
 * Affiche le potentiel réduit ou augmenté ainsi que la liste des questions/réponses
 */
export const PersoPotentielQR = ({
  actionDef,
  questionReponses,
  onChange,
}: TPersoPotentielQRProps) => {
  return (
    <div data-test="PersoPotentielQR">
      <div className="ml-0 mb-4 max-w-fit pl-4 pr-8 py-4 shadow-[inset_0.25rem_0_0_0_rgb(244,196,71)] border border-secondary-1">
        <PointsPotentiels actionId={actionDef.id} />
      </div>
      <QuestionReponseList
        questionReponses={questionReponses}
        onChange={onChange}
        variant="modal"
      />
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
  variant?: 'modal' | 'indicateur' | undefined;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const { qr, hasProportionDescription, variant } = props;
  const { id, type, formulation, description } = qr;
  const Reponse = reponseParType[type];

  return (
    <div
      className={classNames({
        'bg-white border rounded-md p-4 mb-2': variant !== 'modal',
        'my-4': variant === 'modal',
      })}
    >
      <legend
        className={classNames('mb-4 px-4', {
          'font-bold': variant === 'modal',
        })}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formulation) }}
      />
      <div className="pl-4">
        {description ? (
          <Accordion
            containerClassname="mb-6"
            id={`accordion-${id}`}
            title="En savoir plus"
            content={
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(description),
                }}
              />
            }
            icon="information-fill"
          />
        ) : null}
        <Reponse {...props} />
        {variant !== 'indicateur' && <Justification {...props} />}
        {hasProportionDescription ? (
          <Accordion
            containerClassname="mt-6"
            id={`accordion-part-${id}`}
            title="Comment calculer la part ?"
            content="La part se rapporte au nombre d'habitants (nombre d'habitants de la
          collectivité / nombre d'habitants de la structure compétente) ou au
          pouvoir de la collectivité dans la structure compétente (nombre de voix
          d'élu de la collectivité / nombre de voix total dans l'organe
          délibératoire de la structure compétente) si cette part est supérieure à
          celle liée au nombre d'habitants."
            icon="information-fill"
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
  variant?: 'modal' | 'indicateur' | undefined;
};

/** Affiche la liste de questions/réponses */
export const QuestionReponseList = (props: TQuestionReponseListProps) => {
  const { className, questionReponses, variant, onChange } = props;
  return (
    <div className={classNames('flex flex-col gap-4', className)}>
      {questionReponses.map((qr, index) => {
        const { id } = qr;
        return (
          <QuestionReponse
            key={id}
            qr={qr}
            variant={variant}
            onChange={(reponse: TReponse) => onChange(qr, reponse)}
            hasProportionDescription={hasProportionDescription(
              questionReponses,
              index
            )}
          />
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
    ({ type }) => type === 'proportion'
  );
  return index === firstProportionIndex;
};
