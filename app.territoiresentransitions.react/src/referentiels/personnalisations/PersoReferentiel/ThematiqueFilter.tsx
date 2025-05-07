/**
 * Affiche les boutons pour filtrer les thématiques de personnalisation du référentiel
 */

import { referentielToName } from '@/app/app/labels';
import { ReferentielId } from '@/domain/referentiels';
import { Checkbox } from '@/ui';
import { FormEvent } from 'react';

export type TThematiqueFilterProps = {
  referentiels: ReferentielId[];
  onChange: (newSelection: ReferentielId[]) => void;
};

const referentielOptions: ReferentielId[] = ['cae', 'eci'];

export const ThematiqueFilter = (props: TThematiqueFilterProps) => {
  const { referentiels, onChange } = props;
  return (
    <div>
      <legend className="font-semibold mb-3">
        Référentiels à personnaliser
      </legend>
      <div className="flex gap-4">
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
            <Checkbox
              key={referentiel}
              name={referentiel}
              id={referentiel}
              className="py-0"
              checked={checked}
              onChange={handleChange}
              label={referentielToName[referentiel]}
            />
          );
        })}
      </div>
    </div>
  );
};
