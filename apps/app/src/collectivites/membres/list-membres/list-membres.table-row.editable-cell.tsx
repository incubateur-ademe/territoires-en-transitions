import { appLabels } from '@/app/labels/catalog';
import { Textarea } from '@tet/ui';
import { useState } from 'react';

import { membreFonctions, referentielToName } from '@/app/app/labels';
import MultiSelectDropdown from '@/app/ui/shared/select/MultiSelectDropdown';
import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import {
  getCollectiviteRoleDescription,
  getCollectiviteRoleLabel,
} from '@/app/users/authorizations/collectivite-role.utils';
import { useListUserCollectiviteRoles } from '@/app/users/authorizations/use-list-user-collectivite-roles';
import { MembreFonction } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import BadgeAcces from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/badge-acces';

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
      dataTest="details_fonction-textarea"
      value={value}
      className="max-h-[4rem]"
      rows={1}
      onChange={(evt) => setValue(evt.currentTarget.value)}
      onBlur={() => details_fonction !== value && save(value)}
      placeholder={appLabels.placeholderARenseigner}
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
      buttonClassName="rounded-md hover:bg-grey-2"
      value={value}
      options={membreFonctions}
      onSelect={onChange}
      placeholderText={appLabels.placeholderARenseigner}
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
      buttonClassName="rounded-md hover:bg-grey-2"
      placeholderText={appLabels.placeholderARenseigner}
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

export type TAccesDropdownOption = CollectiviteRole;

const AccessDropdownLabel = ({ option }: { option: TAccesDropdownOption }) => {
  return (
    <div>
      <div>{getCollectiviteRoleLabel(option)}</div>
      <div
        aria-label={getCollectiviteRoleDescription(option)}
        className="mt-1 text-xs text-gray-500"
      >
        {getCollectiviteRoleDescription(option)}
      </div>
    </div>
  );
};

type TAccesDropdownProps = {
  value: TAccesDropdownOption;
  onSelect: (value: TAccesDropdownOption) => void;
};

export const CollectiviteRoleDropdown = ({
  value,
  onSelect,
}: TAccesDropdownProps) => {
  const accessLevelsOptions = useListUserCollectiviteRoles();

  return (
    <div data-test="acces-dropdown">
      <SelectDropdown
        placement="bottom-end"
        value={value}
        onSelect={onSelect}
        options={accessLevelsOptions}
        renderSelection={(value) => <BadgeAcces acces={value} size="xs" />}
        renderOption={(option) => (
          <AccessDropdownLabel option={option.value as CollectiviteRole} />
        )}
      />
    </div>
  );
};
