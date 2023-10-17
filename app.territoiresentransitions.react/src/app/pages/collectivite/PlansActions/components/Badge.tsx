import classNames from 'classnames';

type Props = {
  label: string;
  dataTest?: string;
  title?: string;
  className?: string;
  // Rend une version plus petite du composant
  small?: boolean;
};

const Badge = ({dataTest, title, className, label, small}: Props) => {
  return (
    <span
      data-test={dataTest}
      className={classNames(
        'w-max py-1.5 px-3 font-bold text-sm uppercase whitespace-nowrap rounded-md',
        {'!text-xs !py-0.5 !px-2': small},
        className
      )}
      title={title}
    >
      {label}
    </span>
  );
};

export default Badge;
