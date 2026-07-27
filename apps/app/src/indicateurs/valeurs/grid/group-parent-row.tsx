import { Icon } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';

type GroupParentRowProps = {
  label: string;
  rowCount: number;
  valueColumnCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  showAddYearColumn?: boolean;
};

export const GroupParentRow = ({
  label,
  rowCount,
  valueColumnCount,
  isExpanded,
  onToggle,
  showAddYearColumn = false,
}: GroupParentRowProps): JSX.Element => (
  <tr role="row">
    <th
      scope="rowgroup"
      className="sticky left-0 z-10 bg-grey-1 p-2 text-left"
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-1 text-left"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded
            ? appLabels.indicateurReplierGroupe(label)
            : appLabels.indicateurDeplierGroupe(label)
        }
        onClick={onToggle}
      >
        <Icon
          icon={isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'}
          className="shrink-0 text-primary-9"
        />
        <span className="font-bold text-primary-9">{label}</span>
        <span className="shrink-0 text-xs font-normal text-grey-8">
          {appLabels.sousSecteur({ count: rowCount })}
        </span>
      </button>
    </th>
    <td colSpan={valueColumnCount} className="bg-grey-1 p-0" aria-hidden />
    {showAddYearColumn && (
      <td className="sticky right-0 z-10 bg-grey-1 p-0" aria-hidden />
    )}
  </tr>
);
