import classNames from 'classnames';

type BadgeProps = {
  content: string;
  status?:
    | 'default'
    | 'standard'
    | 'success'
    | 'warning'
    | 'new'
    | 'error'
    | 'info'
    | 'grey';
  small?: boolean;
  className?: string;
};

export const Badge = ({
  content,
  status,
  small = false,
  className,
}: BadgeProps) => {
  return (
    <span
      className={classNames(
        'fr-badge',
        {
          'bg-white text-gray-8 border border-grey-5': status === 'default',
          'bg-primary-2 text-primary-7': status === 'standard',
          'bg-success-2 text-success-1': status === 'success',
          'bg-warning-2 text-warning-1': status === 'warning',
          'bg-new-1 text-new-2': status === 'new',
          'bg-error-2 text-error-1': status === 'error',
          'bg-info-2 text-info-1': status === 'info',
          'bg-grey-3 text-grey-6': status === 'grey',
          'fr-badge--sm': small,
        },
        className,
      )}
    >
      {content}
    </span>
  );
};
