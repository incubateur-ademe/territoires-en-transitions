'use client';

import { appLabels } from '@/app/labels/catalog';
import { Icon, Tooltip, useCopyToClipboard } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';

export const IdCopiable = ({
  label,
  value,
  variant = 'principal',
  tooltip,
  dataTest,
}: {
  label: string;
  value: string;
  variant?: 'principal' | 'secondaire';
  tooltip?: string;
  dataTest?: string;
}) => {
  const { copiedText, copy, reset } = useCopyToClipboard();
  const estCopie = copiedText === value;
  const secondaire = variant === 'secondaire';
  const bouton = (
    <button
      type="button"
      data-test={dataTest}
      onClick={() => copy(value)}
      onMouseLeave={reset}
      className={cn(
        'group inline-flex h-8 items-stretch overflow-hidden rounded-md border bg-white p-0 hover:border-primary-7 focus-visible:outline-2 focus-visible:outline-primary-7',
        secondaire ? 'border-dashed border-grey-4' : 'border-grey-4'
      )}
    >
      <span
        className={cn(
          'flex items-center whitespace-nowrap border-r px-2 text-xs font-bold uppercase text-grey-8',
          secondaire
            ? 'border-dashed border-grey-4 bg-grey-1'
            : 'border-grey-4 bg-grey-2'
        )}
      >
        {label}
      </span>
      <span className="flex items-center px-2 font-mono text-sm text-grey-10">
        {value}
      </span>
      <span
        className={cn(
          'flex w-7 items-center justify-center',
          estCopie ? 'bg-success-2 text-success-1' : 'text-primary-9'
        )}
      >
        <Icon icon={estCopie ? 'check-line' : 'file-copy-line'} size="sm" />
      </span>
      <span className="sr-only" aria-live="polite">
        {estCopie ? appLabels.repriseTecCopie : ''}
      </span>
    </button>
  );
  return tooltip ? <Tooltip label={tooltip}>{bouton}</Tooltip> : bouton;
};
