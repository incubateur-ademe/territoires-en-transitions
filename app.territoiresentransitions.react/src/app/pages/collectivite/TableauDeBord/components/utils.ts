import { ModuleDisplay } from '@/app/pages/collectivite/TableauDeBord/components/Module';
import { DefaultButtonProps } from '@/ui';

type DisplayOption = Omit<DefaultButtonProps, 'id'> & {
  id: ModuleDisplay;
};

/** Associe les options demandées aux props des boutons de ButtonGroup */
export const getDisplayButtons = ({
  moduleOptions,
  onClick,
  texts,
}: {
  moduleOptions?: DisplayOption[];
  onClick: (display: ModuleDisplay) => void;
  texts?: Partial<Record<ModuleDisplay, string | undefined>>;
}) => {
  const displayOptions: DisplayOption[] = [
    {
      id: 'circular',
      icon: 'pie-chart-2-line',
      onClick: () => onClick('circular'),
      children: texts?.circular,
    },
    {
      id: 'row',
      icon: 'layout-grid-line',
      onClick: () => onClick('row'),
      children: texts?.row,
    },
  ];
  return moduleOptions
    ? displayOptions.filter((o) => moduleOptions.some((opt) => opt.id === o.id))
    : displayOptions;
};
