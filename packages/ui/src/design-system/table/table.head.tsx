import { cn } from '../../utils/cn';

type Props = React.HTMLAttributes<HTMLTableSectionElement>;

/** Provides a sticky header for tables */
export const TableHead = ({ className, ...props }: Props) => {
  return (
    <thead
      className={cn(
        // Shadow is used as border because the default border collapses on scroll when sticky
        'sticky top-0 bg-white shadow-[0_1px_0px_0px] shadow-grey-3 z-[1]',
        className
      )}
      {...props}
    />
  );
};
