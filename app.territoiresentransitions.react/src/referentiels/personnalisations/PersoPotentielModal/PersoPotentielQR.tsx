/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionScore } from '@/app/referentiels/DEPRECATED_score-hooks';
import {
  TChangeReponse,
  TQuestionReponse,
  TReponse,
} from '@/app/referentiels/personnalisations/personnalisation.types';
import {
  useScore,
  useSnapshotFlagEnabled,
} from '@/app/referentiels/use-snapshot';
import { Accordion } from '@/app/ui/Accordion';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { Justification } from './Justification';
import { PointsPotentiels } from './PointsPotentiels';
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
  const DEPRECATED_actionScore = useActionScore(actionDef.id);
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_score = useScore(actionDef.id);

  if (!DEPRECATED_actionScore || !NEW_score) {
    return null;
  }

  const color = 'var(--yellow-moutarde-850-200)';
  return (
    <div data-test="PersoPotentielQR">
      <div
        className="fr-highlight"
        style={{
          boxShadow: `inset 0.25rem 0 0 0 ${color}`,
          marginLeft: 0,
          maxWidth: 'fit-content',
          paddingRight: '2rem',
          paddingTop: '1rem',
          paddingBottom: '1rem',
          border: `1px solid ${color}`,
        }}
      >
        <PointsPotentiels
          score={
            FLAG_isSnapshotEnabled
              ? {
                  ...NEW_score,
                }
              : {
                  pointPotentiel: DEPRECATED_actionScore.point_potentiel,
                  pointPotentielPerso:
                    DEPRECATED_actionScore.point_potentiel_perso === undefined
                      ? null
                      : DEPRECATED_actionScore.point_potentiel_perso,
                  pointReferentiel: DEPRECATED_actionScore.point_referentiel,
                  desactive: DEPRECATED_actionScore.desactive,
                }
          }
        />
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
  variant?: 'modal' | undefined;
};

/** Affiche une question/réponse et son éventuel libellé d'aide */
const QuestionReponse = (props: TQuestionReponseProps) => {
  const { qr, hasProportionDescription, variant } = props;
  const { id, type, formulation, description } = qr;
  const Reponse = reponseParType[type];

  return (
    <div
      className={classNames({
        'border rounded-md p-4 mb-2': variant !== 'modal',
        'my-4': variant === 'modal',
      })}
    >
      <legend
        className={classNames(
          'fr-fieldset__legend fr-fieldset__legend--regular',
          {
            '!font-bold fr-text--lg': variant === 'modal',
          }
        )}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formulation) }}
      />
      <div className="pl-4">
        {description ? (
          <Accordion
            className="mb-6"
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
            className="mt-6"
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
  const { className, questionReponses, variant, onChange } = props;
  return (
    <div className={classNames('fr-form-group', className)}>
      {questionReponses.map((qr, index) => {
        const { id } = qr;
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
    ({ type }) => type === 'proportion'
  );
  return index === firstProportionIndex;
};
