import { Icon, IconValue, Tooltip } from '@/ui';
import classNames from 'classnames';

type Props = {
  title?: string;
  list: string[];
  icon?: IconValue;
  hoveringColor?: 'grey' | 'primary';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const ListWithTooltip = ({
  title,
  list,
  icon,
  hoveringColor = 'primary',
  onClick,
  className,
  disabled,
}: Props) => {
  const isClickable = !!onClick && !disabled;

  if (list.length === 0) return null;

  const [firstItem, ...otherItems] = list;
  return (
    <span
      title={title}
      onClick={isClickable ? onClick : undefined}
      className={classNames(
        {
          'cursor-pointer py-1 px-2 rounded-md -mx-2 -my-1 transition-colors':
            isClickable,
          'hover:bg-grey-3': isClickable && hoveringColor === 'grey',
          'hover:bg-primary-2': isClickable && hoveringColor === 'primary',
        },
        className
      )}
    >
      {!!icon && <Icon icon={icon} size="sm" className="mr-1" />}
      {firstItem}
      {otherItems.length > 0 && (
        <Tooltip
          openingDelay={250}
          label={
            <ul className="max-w-xs list-disc list-inside">
              {otherItems.map((element, i) => (
                <li key={i}>{element}</li>
              ))}
            </ul>
          }
        >
          <span className="ml-1.5 font-medium text-primary-8">
            +{otherItems.length}
          </span>
        </Tooltip>
      )}
    </span>
  );
};

export default ListWithTooltip;
