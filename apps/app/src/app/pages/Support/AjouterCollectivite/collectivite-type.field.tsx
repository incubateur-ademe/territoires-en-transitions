import { appLabels } from '@/app/labels/catalog';
import { Field, Option, Select } from '@tet/ui';
type Props = {
  type?: string;
  onSelect: (type?: Option) => void;
};

export const collectiviteType = {
  Region: 'region',
  Departement: 'departement',
  EPCI: 'epci',
  Commune: 'commune',
  Test: 'test',
  PrefectureRegion: 'prefecture_region',
  PrefectureDepartement: 'prefecture_departement',
  ServicePublic: 'service_public',
} as const;

export const CollectiviteTypeField = ({ type, onSelect }: Props) => {
  const options: Option[] = [
    { label: appLabels.commune, value: collectiviteType.Commune },
    { label: appLabels.formTypeEpci, value: collectiviteType.EPCI },
    {
      label: appLabels.departement,
      value: collectiviteType.Departement,
    },
    { label: appLabels.region, value: collectiviteType.Region },
    {
      label: appLabels.formTypePrefectureDepartement,
      value: collectiviteType.PrefectureDepartement,
    },
    {
      label: appLabels.formTypePrefectureRegion,
      value: collectiviteType.PrefectureRegion,
    },
    {
      label: appLabels.formTypeServicePublic,
      value: collectiviteType.ServicePublic,
    },
    { label: appLabels.formTypeCollectiviteTest, value: collectiviteType.Test },
  ];

  return (
    <Field title={appLabels.typeCollectivite} className="self-end">
      <Select
        options={options}
        values={type ?? ''}
        onChange={(value) => onSelect(options.find((t) => t.value === value))}
      />
    </Field>
  );
};
