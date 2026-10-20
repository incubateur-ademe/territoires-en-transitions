import { JSX, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardProps } from '../Card';

type WithoutClassNameDataTestAndId<Props> = Props extends unknown
  ? Omit<Props, 'className' | 'dataTest' | 'id'>
  : never;

export type ActionCardProps = WithoutClassNameDataTestAndId<CardProps> & {
  hoverActions?: ReactNode;
};

export const ActionCard = ({
  hoverActions,
  disabled,
  isSelected,
  ...cardProps
}: ActionCardProps): JSX.Element => (
  <div className="group relative h-full">
    {!!hoverActions && !disabled && (
      <div className="absolute right-4 top-4 z-10 flex gap-2 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
        {hoverActions}
      </div>
    )}
    <Card
      {...cardProps}
      disabled={disabled}
      isSelected={isSelected}
      className={cn(
        'h-full gap-2 p-4 font-normal text-grey-8 shadow-none hover:shadow-none',
        !disabled && 'group-hover:bg-primary-1',
        !disabled && !isSelected && 'group-hover:border-primary-3'
      )}
    />
  </div>
);
