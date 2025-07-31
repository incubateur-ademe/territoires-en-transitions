import { Icon, IconProps } from './Icon';

export const ArrowRightIcon = ({ ...props }: Omit<IconProps, 'path'>) => {
  return (
    <Icon
      path="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"
      {...props}
    />
  );
};
