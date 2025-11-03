import { Textarea } from '@/ui';
import { useState } from 'react';

import { membreFonctions, referentielToName } from '@/app/app/labels';
import MultiSelectDropdown from '@/app/ui/shared/select/MultiSelectDropdown';
import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import { MembreFonction } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { PermissionLevel } from '@/domain/users';
import BadgeAcces from '../../components/badge-acces';
import { niveauAcces } from './membres-liste-table-row';

/**
 * La nouvelle version du composant est dans le fichier membres-liste-table-row.tsx
 * Les composants dans ce fichier seront à remplacer
 * lors de la refonte de la gestion des membres
 */

export const niveauAccessDetail: Record<PermissionLevel, string> = {
  admin: 'Peut entièrement configurer et éditer',
  edition: 'Peut éditer et inviter de nouveaux membres',
  lecture: 'Peut uniquement consulter',
};

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
      resize="none"
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

export type TAccesDropdownOption = PermissionLevel;

const AccessDropdownLabel = ({
  option,
  currentUserAccess,
}: {
  option: TAccesDropdownOption;
  currentUserAccess: PermissionLevel;
}) => {
  if (currentUserAccess === 'admin')
    return (
      <div>
        <div>{niveauAcces.find((v) => v.value === option)?.label}</div>
        <div
          aria-label={niveauAccessDetail[option]}
          className="mt-1 text-xs text-gray-500"
        >
          {niveauAccessDetail[option]}
        </div>
      </div>
    );
  return null;
};

type TAccesDropdownProps = {
  currentUserAccess: PermissionLevel;
  value: TAccesDropdownOption;
  onSelect: (value: TAccesDropdownOption) => void;
};

export const AccesDropdown = ({
  currentUserAccess,
  value,
  onSelect,
}: TAccesDropdownProps) => {
  if (currentUserAccess !== 'admin')
    return (
      <BadgeAcces
        acces={niveauAcces.find((v) => v.value === currentUserAccess)?.value}
        size="sm"
        className="ml-3"
      />
    );

  return (
    <div data-test="acces-dropdown">
      <SelectDropdown
        placement="bottom-end"
        value={value}
        onSelect={onSelect}
        options={niveauAcces}
        renderSelection={(value) => (
          <BadgeAcces
            acces={niveauAcces.find((v) => v.value === value)?.value}
            size="sm"
          />
        )}
        renderOption={(option) => (
          <AccessDropdownLabel
            option={option.value as PermissionLevel}
            currentUserAccess={currentUserAccess}
          />
        )}
      />
    </div>
  );
};
