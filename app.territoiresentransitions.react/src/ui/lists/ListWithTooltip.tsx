import { Icon, IconValue, Tooltip } from '@/ui';

type Props = {
  title?: string;
  list: string[];
  icon?: IconValue;
};

const ListWithTooltip = ({ title, list, icon }: Props) => {
  return (
    <span title={title}>
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
