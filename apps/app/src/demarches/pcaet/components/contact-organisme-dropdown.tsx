import { DemarchePcaetContactOption } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { SelectMultiple } from '@tet/ui';
import { JSX } from 'react';

export const ContactOrganismeDropdown = ({
  label,
  options,
  values,
  disabled,
  onChange,
}: {
  label: string;
  options: DemarchePcaetContactOption[];
  values: string[];
  disabled: boolean;
  onChange: (values: string[]) => void;
}): JSX.Element => (
  <div className="flex flex-col gap-1">
    <span className="text-sm font-medium text-primary-9">{label}</span>
    <SelectMultiple
      values={values}
      options={options}
      disabled={disabled}
      placeholder={appLabels.demarchePcaetContactsSelection}
      onChange={({ values: next }) => onChange((next ?? []).map(String))}
    />
  </div>
);
