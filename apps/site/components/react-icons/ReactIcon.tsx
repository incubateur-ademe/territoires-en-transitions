import * as ReactIcons from 'react-icons/ri';

interface IIconComponent {
  icon: string;
  className?: string;
}
type TReactIcon = keyof typeof ReactIcons;

const ReactIcon: React.FC<IIconComponent> = ({icon, className}) => {
  const DynamicIconComponent = ReactIcons[icon as TReactIcon];

  if (DynamicIconComponent === undefined) return <></>;

  return <DynamicIconComponent className={className} />;
};

export default ReactIcon;
