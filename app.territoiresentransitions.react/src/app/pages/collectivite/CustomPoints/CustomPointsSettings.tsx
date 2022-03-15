/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import {PotentielAction} from './PotentielAction';

export type TCustomPointsSettingsProps = {};

export const CustomPointsSettings = (props: TCustomPointsSettingsProps) => {
  //const {} = props;
  return (
    <div data-test="CustomPointsSettings">
      <PotentielAction points={6.7} />
      <h6 className="mt-8">Caractéristique liée</h6>
      <div className="fr-form-group">
        <fieldset className="fr-fieldset">
          <Question />
          <ChoiceQuestion />
          {/* <BooleanQuestion />  */}
          {/* <NumberQuestion /> */}
          <CustomPointsHistory />
        </fieldset>
      </div>
    </div>
  );
};

/** La question et son éventuel libellé d'aide */
const Question = () => (
  <>
    <legend className="fr-fieldset__legend fr-text--regular" id="radio-legend">
      La collectivité a-t-elle la compétence <b>voirie</b> ?
    </legend>
    <span className="fr-hint-text">Exemple : contrat de construction</span>
  </>
);

/** Une question entre plusieurs énoncés */
const ChoiceQuestion = () => (
  <div className="fr-fieldset__content">
    <div className="fr-radio-group fr-radio-group--sm">
      <input type="radio" id="radio-1" name="radio" />
      <label className="fr-label" htmlFor="radio-1">
        Oui, pour l’ensemble de la collectivité
      </label>
    </div>
    <div className="fr-radio-group fr-radio-group--sm">
      <input type="radio" id="radio-2" name="radio" />
      <label className="fr-label" htmlFor="radio-2">
        Oui, uniquement sur trottoirs, parkings ou zones d'activités ou
        industrielles
      </label>
    </div>
    <div className="fr-radio-group fr-radio-group--sm">
      <input type="radio" id="radio-3" name="radio" />
      <label className="fr-label" htmlFor="radio-3">
        Non
      </label>
    </div>
  </div>
);

/** Une question entre oui et non */
const BooleanQuestion = () => (
  <div className="fr-fieldset__content fr-fieldset--inline">
    <div className="fr-radio-group fr-radio-group--sm">
      <input type="radio" id="radio-1" name="radio" />
      <label className="fr-label" htmlFor="radio-1">
        Oui
      </label>
    </div>
    <div className="fr-radio-group fr-radio-group--sm">
      <input type="radio" id="radio-2" name="radio" />
      <label className="fr-label" htmlFor="radio-2">
        Non
      </label>
    </div>
  </div>
);

/** Une question donnant lieu à la saisie d'une valeur */
const NumberQuestion = () => (
  <div className="fr-fieldset__content fr-fieldset--inline">
    <label className="fr-label" htmlFor="text-input-text">
      Part en pourcentage
    </label>
    <input
      className="fr-input max-w-xs"
      type="text"
      id="text-input-text"
      name="text-input-text"
    />
  </div>
);

/** L'historique des personnalisations pour une sous-action */
export const CustomPointsHistory = (props: TCustomPointsSettingsProps) => {
  return (
    <div>
      <h6 className="mt-8">Historique</h6>
      <div className="mb-2">
        <span className="font-bold pr-2">Richard Stallman</span>
        <span className="text-grey425 fr-text--sm">23 janvier 2022</span>
      </div>
      <span>Personnalisation du potentiel : 6,67 à 3,3 points</span>
    </div>
  );
};
