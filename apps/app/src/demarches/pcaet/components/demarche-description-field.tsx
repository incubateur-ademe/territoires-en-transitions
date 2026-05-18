import { appLabels } from '@/app/labels/catalog';
import { Textarea } from '@tet/ui';

type Props = {
  value: string;
  isReadonly: boolean;
  onChange: (description: string) => void;
};

export const DemarcheDescriptionField = ({
  value,
  isReadonly,
  onChange,
}: Props) => {
  if (isReadonly) {
    return (
      <p className="text-sm text-grey-8 whitespace-pre-wrap">
        {value || appLabels.demarchePcaetDetailDescriptionVide}
      </p>
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder={appLabels.demarchePcaetDetailDescriptionPlaceholder}
    />
  );
};
