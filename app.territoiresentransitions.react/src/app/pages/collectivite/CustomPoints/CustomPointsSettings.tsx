/**
 * Affiche l'onglet "Personnalisation du potentiel"
 */

import {MouseEventHandler} from 'react';

export type TCustomPointsSettingsProps = {};

export const CustomPointsSettings = (props: TCustomPointsSettingsProps) => {
  //const {} = props;
  return (
    <div data-test="CustomPointsSettings">
      <div className="fr-alert fr-alert--info fr-alert--sm">
        <p>Potentiel pour cette sous-action : 6,7 points</p>
      </div>
      <h6 className="mt-4">Caractéristique liée</h6>
      <div className="fr-form-group">
        <fieldset className="fr-fieldset">
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id="radio-legend"
          >
            La collectivité a-t-elle la compétence voirie ?
          </legend>
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
        </fieldset>
      </div>
    </div>
  );
};

export const CustomPointsSettingsUpdated = (
  props: TCustomPointsSettingsProps
) => {
  //const {} = props;
  const onEdit: MouseEventHandler = e => {
    e.preventDefault();
  };

  return (
    <div data-test="CustomPointsSettings">
      <div className="fr-alert fr-alert--info fr-alert--sm">
        <p>Potentiel réduit pour cette sous-action : 3,3 points</p>
      </div>
      <h6 className="mt-4">Caractéristique liée</h6>
      <legend className="fr-fieldset__legend fr-text--regular">
        La collectivité n'a pas la compétence voirie
      </legend>
      <a
        href="#"
        className="fr-link fr-link--icon-left fr-fi-edit-line mb-4"
        onClick={onEdit}
      >
        Gérer les caractéristiques de ma collectivité
      </a>
      <hr />
      <h6>Historique</h6>
      <div>
        <div className="mb-2">
          <span className="font-bold pr-2">Richard Stallman</span>
          <span className="text-grey425 fr-text--sm">23 janvier 2022</span>
        </div>
        <span>
          Personnalisation du potentiel via la gestion des caractéristiques :
          6,67 à 3,3 points
        </span>
      </div>
    </div>
  );
};
