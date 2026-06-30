import { appLabels } from '@/app/labels/catalog';
import { cn, Icon, IconValue, InfoTooltip } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { HTMLAttributes, ReactNode } from 'react';

export type MetadataItemProps = {
  dataTest?: string;
  interactive?: boolean;
  hideSeparator?: boolean;
  icon: IconValue;
  label: string;
  value: ReactNode;
  tooltip?: string;
} & HTMLAttributes<HTMLDivElement>;

export const MetadataItem = ({
  dataTest,
  interactive = false,
  hideSeparator = false,
  icon,
  label,
  value,
  tooltip,
  ...props
}: MetadataItemProps) => {
  return (
    <div
      {...props}
      className={cn(props.className, 'flex items-center')}
      data-test={dataTest}
    >
      <div
        className={cn('flex items-center gap-2 py-1.5', {
          'hover:bg-grey-3 rounded px-2 -mx-2': interactive,
        })}
      >
        <Icon icon={icon} />
        <span className="font-normal">{`${label} : `}</span>
        {isNil(value) || value === '' ? (
          <span className="text-warning-1">{appLabels.aCompleterMaj}</span>
        ) : (
          <span className="font-medium">{value}</span>
        )}
        {tooltip && <InfoTooltip label={tooltip} />}
      </div>
      {!hideSeparator && <div className="ml-4 w-[1px] h-4 bg-primary-3" />}
    </div>
  );
};
