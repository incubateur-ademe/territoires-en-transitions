import { cn } from '../../utils/cn';

type Props = {
  className?: string;
  color?: 'grey' | 'primary';
  orientation?: 'horizontal' | 'vertical';
};

export const Divider = ({
  color = 'grey',
  orientation = 'horizontal',
  className,
}: Props) => {
  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        {
          'border-grey-4': color === 'grey',
          'border-primary-3': color === 'primary',
        },
        {
          'border-t w-full': orientation === 'horizontal',
          'border-l w-px h-full': orientation === 'vertical',
        },
        className
      )}
    />
  );
};
