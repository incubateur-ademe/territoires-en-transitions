import { appLabels } from '@/app/labels/catalog';
import type { DemarcheType } from '@tet/domain/demarches';
import { Textarea } from '@tet/ui';

type Props = {
  value: string;
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;

  isReadonly: boolean;
  onChange: (description: string) => void;
};

export const DemarcheDescriptionField = ({
  value,
  demarcheType,
  isReadonly,
  onChange,
}: Props) => {
  if (isReadonly) {
    return (
      <p className="text-sm text-grey-8 whitespace-pre-wrap">
        {value || appLabels.demarcheDetailDescriptionVide}
      </p>
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder={appLabels.demarcheDetailDescriptionPlaceholder({
        type: appLabels.demarcheTypeLabels[demarcheType],
      })}
    />
  );
};
