import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { cn, EmptyCard, Icon } from '@/ui';

export const THeadCell = ({
  title,
  sortFn,
  className,
  icon,
}: {
  title?: string;
  sortFn?: () => void;
  className?: string;
  icon?: string;
}) => {
  return (
    <th className={cn('p-4 text-sm', className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <Icon
            icon={icon}
            size={title ? 'sm' : 'md'}
            className={cn({ 'm-auto': !title })}
          />
        )}
        {title && (
          <span className="font-medium leading-none text-grey-9 uppercase">
            {title}
          </span>
        )}
        {sortFn && (
          <div
            className="flex flex-col ml-auto cursor-pointer"
            onClick={sortFn}
          >
            <Icon
              icon="arrow-up-s-fill"
              className="-mb-0.5 flex items-center justify-center h-3 w-3 text-[0.75rem]"
            />
            <Icon
              icon="arrow-down-s-fill"
              className="-mt-0.5 flex items-center justify-center h-3 w-3 text-[0.75rem]"
            />
          </div>
        )}
      </div>
    </th>
  );
};

export const TRow = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <tr
    className={cn(
      'group relative border-b border-grey-3 even:bg-grey-1',
      className
    )}
  >
    {children}
  </tr>
);

export const TRowLoading = ({
  columnIds,
  nbOfRows = 10,
}: {
  columnIds: string[];
  nbOfRows?: number;
}) =>
  [...Array(nbOfRows).keys()].map((i) => (
    <TRow key={i}>
      {columnIds.map((columnId) => (
        <td key={columnId} className="px-4 py-3">
          <div className="animate-pulse h-5 bg-grey-2 rounded-md" />
        </td>
      ))}
    </TRow>
  ));

export const TRowEmpty = ({
  columnIds,
  title,
  classNames,
}: {
  columnIds: string[];
  title: string;
  classNames?: string;
}) => (
  <tr>
    <td colSpan={columnIds.length}>
      <EmptyCard
        className={cn('min-h-[50vh]', classNames)}
        picto={(props) => <PictoExpert {...props} />}
        title={title}
        variant="transparent"
        size="xs"
      />
    </td>
  </tr>
);
