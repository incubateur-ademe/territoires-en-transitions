/**
 * Affiche les boutons pour filtrer les thématiques de personnalisation du référentiel
 */

import {referentielToName} from 'app/labels';
import {FormEvent} from 'react';
import {ReferentielOfIndicateur} from 'types/litterals';

export type TThematiqueFilterProps = {
  selected: ReferentielOfIndicateur[];
  onChange: (newSelection: ReferentielOfIndicateur[]) => void;
};

const referentiels: ReferentielOfIndicateur[] = ['cae', 'eci'];

export const ThematiqueFilter = (props: TThematiqueFilterProps) => {
  const {selected, onChange} = props;
  return (
    <fieldset className="fr-fieldset fr-fieldset--inline">
      <legend className="fr-fieldset__legend font-bold">
        Référentiels à personnaliser
      </legend>
      <div className="fr-fieldset__content">
        {referentiels.map(referentiel => {
          const checked = selected.includes(referentiel);
          const handleChange = (e: FormEvent<HTMLInputElement>) => {
            const {checked: isCheckedNow} = e.currentTarget;
            onChange(
              isCheckedNow
                ? [...selected, referentiel]
                : selected.filter(r => r !== referentiel)
            );
          };

          return (
            <div
              key={referentiel}
              className="fr-checkbox-group fr-checkbox-inline"
            >
              <input
                type="checkbox"
                name={referentiel}
                id={referentiel}
                className="py-0"
                checked={checked}
                onChange={handleChange}
              />
              <label className="fr-label" htmlFor={referentiel}>
                {referentielToName[referentiel]}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};
