import { Icon, IconValue, Tooltip } from '@/ui';
import classNames from 'classnames';

type Props = {
  title?: string;
  list: string[];
  icon?: IconValue;
  hoveringColor?: 'grey' | 'primary';
  onClick?: () => void;
};

const ListWithTooltip = ({
  title,
  list,
  icon,
  hoveringColor = 'primary',
  onClick,
}: Props) => {
  return (
    <span
      title={title}
      onClick={onClick}
      className={classNames({
        'cursor-pointer py-1 px-2 rounded-md -mx-2 -my-1 transition-colors':
          !!onClick,
        'hover:bg-grey-3': !!onClick && hoveringColor === 'grey',
        'hover:bg-primary-2': !!onClick && hoveringColor === 'primary',
      })}
    >
      {!!icon && <Icon icon={icon} size="sm" className="mr-1" />}
      {list[0]}
      {list.length > 1 && (
        <Tooltip
          openingDelay={250}
          label={
            <ul className="max-w-xs list-disc list-inside">
              {list.map((element, i) => (
                <li key={i}>{element}</li>
              ))}
            </ul>
          }
        >
          <span className="ml-1.5 font-medium text-primary-8">
            +{list.length - 1}
          </span>
        </Tooltip>
      )}
    </span>
  );
};

export default ListWithTooltip;
