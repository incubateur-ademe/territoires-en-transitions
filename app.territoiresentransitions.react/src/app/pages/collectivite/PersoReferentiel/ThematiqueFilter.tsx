/**
 * Affiche les boutons pour filtrer les thématiques de personnalisation du référentiel
 */

import { referentielToName } from '@/app/app/labels';
import { Referentiel } from '@/app/referentiels/litterals';
import { FormEvent } from 'react';

export type TThematiqueFilterProps = {
  referentiels: Referentiel[];
  onChange: (newSelection: Referentiel[]) => void;
};

const referentielOptions: Referentiel[] = ['cae', 'eci'];

export const ThematiqueFilter = (props: TThematiqueFilterProps) => {
  const { referentiels, onChange } = props;
  return (
    <fieldset className="fr-fieldset fr-fieldset--inline">
      <legend className="fr-fieldset__legend font-bold">
        Référentiels à personnaliser
      </legend>
      <div className="fr-fieldset__content">
        {referentielOptions.map((referentiel) => {
          const checked = referentiels.includes(referentiel);
          const handleChange = (e: FormEvent<HTMLInputElement>) => {
            const { checked: isCheckedNow } = e.currentTarget;
            onChange(
              isCheckedNow
                ? [...referentiels, referentiel]
                : referentiels.filter((r) => r !== referentiel)
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
