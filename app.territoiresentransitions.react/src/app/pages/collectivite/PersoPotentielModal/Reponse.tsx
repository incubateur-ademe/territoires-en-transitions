import {FC, FormEvent} from 'react';
import {TReponse} from './TQuestionReponse';
import {TQuestionReponseProps} from './PersoPotentielQR';

/** Affiche une réponse donnant le choix entre plusieurs énoncés */
const ReponseChoix = ({qr}: TQuestionReponseProps) => {
  const {id: questionId, choix, reponse} = qr;

  return (
    <div className="fr-fieldset__content">
      {choix?.map(({id: choiceId, label}) => {
        const eltId = `${questionId}-${choiceId}`;
        return (
          <div key={choiceId} className="fr-radio-group fr-radio-group--sm">
            <input
              type="radio"
              name="choix"
              id={eltId}
              checked={reponse === choiceId}
              value={choiceId}
            />
            <label className="fr-label" htmlFor={eltId}>
              {label}
            </label>
          </div>
        );
      })}
    </div>
  );
};
/** Affiche une réponse donnant le choix entre oui et non */
const ReponseBinaire = ({qr}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const idYes = `${questionId}-y`;
  const idNo = `${questionId}-n`;

  return (
    <div className="fr-fieldset__content fr-fieldset--inline">
      <div className="fr-radio-group fr-radio-group--sm">
        <input
          type="radio"
          name="binaire"
          id={idYes}
          value="true"
          checked={reponse === true}
        />
        <label className="fr-label" htmlFor={idYes}>
          Oui
        </label>
      </div>
      <div className="fr-radio-group fr-radio-group--sm">
        <input
          type="radio"
          name="binaire"
          id={idNo}
          value="false"
          checked={reponse === false}
        />
        <label className="fr-label" htmlFor={idNo}>
          Non
        </label>
      </div>
    </div>
  );
};
/** Affiche une réponse donnant lieu à la saisie d'une valeur entre 0 et 100 */
const DEFAULT_RANGE = [0, 100];
const ReponseProportion = ({qr}: TQuestionReponseProps) => {
  const {id: questionId, reponse} = qr;
  const [min, max] = DEFAULT_RANGE;

  return (
    <div className="fr-fieldset__content fr-fieldset--inline">
      <label className="fr-label" htmlFor={questionId}>
        Part en pourcentage
      </label>
      <input
        type="number"
        name="proportion"
        min={min}
        max={max}
        id={questionId}
        style={{width: 224}}
        className="fr-input"
        value={String(reponse)}
      />
    </div>
  );
};
// correspondances entre un type de réponse et son composant
export const reponseParType: {[k: string]: FC<TQuestionReponseProps>} = {
  choix: ReponseChoix,
  binaire: ReponseBinaire,
  proportion: ReponseProportion,
};
// correspondances entre un type de réponse attendue et sa fonction de
// traitement de la valeur modifiée
export const traiteChgtReponseParType: {
  [k: string]: (e: FormEvent<HTMLFieldSetElement>) => TReponse;
} = {
  choix: e => {
    const {value} = e.target as HTMLInputElement;
    return value;
  },
  binaire: e => {
    const {value} = e.target as HTMLInputElement;
    return value === 'true';
  },
  proportion: e => {
    const {value, min, max} = e.target as HTMLInputElement;
    const v = Math.min(Math.max(parseInt(min), parseInt(value)), parseInt(max));
    return isNaN(v) ? null : v;
  },
};
