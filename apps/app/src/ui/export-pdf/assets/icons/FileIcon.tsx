import { Icon, IconProps } from './Icon';

export const FileIcon = ({ ...props }: Omit<IconProps, 'path'>) => {
  return (
    <Icon
      path="M3 8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8ZM10 4V9H5V20H19V4H10Z"
      {...props}
    />
  );
};
