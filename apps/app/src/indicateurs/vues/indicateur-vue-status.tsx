import { appLabels } from '@/app/labels/catalog';
import { Icon, InfoTooltip } from '@tet/ui';

type Props = {
  hasUnsavedChanges: boolean;
};

export function IndicateurVueStatus({ hasUnsavedChanges }: Props) {
  const { icon, label } = hasUnsavedChanges
    ? {
        icon: (
          <InfoTooltip
            label={appLabels.indicateurVueUnsavedTooltip}
            placement="top"
            iconClassName="text-warning-1"
          />
        ),
        label: appLabels.indicateurVueUnsaved,
      }
    : {
        icon: <Icon icon="check-line" size="sm" className="text-success" />,
        label: appLabels.indicateurVueSaved,
      };

  return (
    <div
      className="inline-flex items-center gap-2 text-sm text-grey-8"
      data-test="indicateurs.vues.status"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}
