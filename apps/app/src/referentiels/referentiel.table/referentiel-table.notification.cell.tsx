import { ActionType } from '@tet/domain/referentiels';
import { cn, Notification, TableCell } from '@tet/ui';
import Link from 'next/link';
import { actionTypeToClassName } from './utils';

type Props = {
  onClick?: () => void;
  link?: string;
  count?: number;
  actionType: ActionType;
};

export const ReferentielTableNotificationCell = ({
  link,
  onClick,
  count,
  actionType,
}: Props) => {
  return (
    <TableCell className={cn(actionTypeToClassName[actionType])}>
      {count && count > 0 && (
        <>
          {link && (
            <Link
              href={link}
              className="flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <NotificationCount count={count} />
            </Link>
          )}
          {onClick && (
            <button
              onClick={onClick}
              className="flex items-center justify-center w-full"
            >
              <NotificationCount count={count} />
            </button>
          )}
        </>
      )}
    </TableCell>
  );
};

const NotificationCount = ({ count }: Pick<Props, 'count'>) => {
  return (
    <Notification
      number={count}
      classname="text-primary-9 border border-primary-9 bg-white"
      size="sm"
    />
  );
};
