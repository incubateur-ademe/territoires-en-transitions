import { Textarea } from '@/ui';
import { useState } from 'react';

import { membreFonctions, referentielToName } from '@/app/app/labels';
import MultiSelectDropdown from '@/app/ui/shared/select/MultiSelectDropdown';
import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import {
  getAccessLevelDescription,
  getAccessLevelLabel,
} from '@/app/users/authorizations/permission-access-level.utils';
import { useAccessLevels } from '@/app/users/authorizations/use-access-levels';
import { MembreFonction } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { CollectiviteAccessLevel } from '@/domain/users';
import BadgeAcces from '../../_components/badge-acces';

/**
 * La nouvelle version du composant est dans le fichier membres-liste-table-row.tsx
 * Les composants dans ce fichier seront à remplacer
 * lors de la refonte de la gestion des membres
 */

export const DetailsFonctionTextarea = ({
  details_fonction,
  save,
}: {
  details_fonction: string;
  save: (value: string) => void;
}) => {
  const [value, setValue] = useState(details_fonction);
  return (
    <Textarea
      data-test="details_fonction-textarea"
      value={value}
      className="max-h-[4rem]"
      rows={1}
      onChange={(evt) => setValue(evt.currentTarget.value)}
      onBlur={() => details_fonction !== value && save(value)}
      placeholder="À renseigner"
    />
  );
};

export const FonctionDropdown = ({
  value,
  onChange,
}: {
  value?: MembreFonction;
  onChange: (value: MembreFonction) => void;
}) => (
  <div data-test="fonction-dropdown">
    <SelectDropdown
      value={value}
      options={membreFonctions}
      onSelect={onChange}
      placeholderText="À renseigner"
    />
  </div>
);

const referentiels = [
  { label: referentielToName['eci'], value: 'eci' },
  { label: referentielToName['cae'], value: 'cae' },
];

export const ChampsInterventionDropdown = ({
  values,
  onChange,
}: {
  values: ReferentielId[];
  onChange: (value: ReferentielId[]) => void;
}) => (
  <div data-test="champ_intervention-dropdown">
    <MultiSelectDropdown
      options={referentiels}
      onSelect={onChange}
      values={values}
      placeholderText="À renseigner"
      renderSelection={(values) => (
        <span className="mr-auto flex flex-col gap-2">
          {values.sort().map((value) => (
            <div key={value}>
              {referentiels.find(({ value: v }) => v === value)?.label || ''}
            </div>
          ))}
        </span>
      )}
    />
  </div>
);

export type TAccesDropdownOption = CollectiviteAccessLevel;

const AccessDropdownLabel = ({
  option,
  currentUserAccess,
}: {
  option: TAccesDropdownOption;
  currentUserAccess: CollectiviteAccessLevel;
}) => {
  if (currentUserAccess === 'admin')
    return (
      <div>
        <div>{getAccessLevelLabel(option)}</div>
        <div
          aria-label={getAccessLevelDescription(option)}
          className="mt-1 text-xs text-gray-500"
        >
          {getAccessLevelDescription(option)}
        </div>
      </div>
    );
  return null;
};

type TAccesDropdownProps = {
  currentUserAccess: CollectiviteAccessLevel;
  value: TAccesDropdownOption;
  onSelect: (value: TAccesDropdownOption) => void;
};

export const AccesDropdown = ({
  currentUserAccess,
  value,
  onSelect,
}: TAccesDropdownProps) => {
  const accessLevelsOptions = useAccessLevels({ allowAdmin: true });

  if (currentUserAccess !== 'admin')
    return <BadgeAcces acces={currentUserAccess} size="sm" className="ml-3" />;

  return (
    <div data-test="acces-dropdown">
      <SelectDropdown
        placement="bottom-end"
        value={value}
        onSelect={onSelect}
        options={accessLevelsOptions}
        renderSelection={(value) => (
          <BadgeAcces acces={value as CollectiviteAccessLevel} size="sm" />
        )}
        renderOption={(option) => (
          <AccessDropdownLabel
            option={option.value as CollectiviteAccessLevel}
            currentUserAccess={currentUserAccess}
          />
        )}
      />
    </div>
  );
};
