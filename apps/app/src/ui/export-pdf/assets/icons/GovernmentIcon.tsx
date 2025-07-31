import { Icon, IconProps } from './Icon';

export const GovernmentIcon = ({ ...props }: Omit<IconProps, 'path'>) => {
  return (
    <Icon
      path="M20 6H23V8H22V19H23V21H1V19H2V8H1V6H4V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V6ZM20 8H4V19H7V12H9V19H11V12H13V19H15V12H17V19H20V8ZM6 5V6H18V5H6Z"
      {...props}
    />
  );
};
