import { Icon, IconProps } from './Icon';

export const DownloadIcon = ({ ...props }: Omit<IconProps, 'path'>) => {
  return (
    <Icon path="M3 19H21V21H3V19ZM13 9H20L12 17L4 9H11V1H13V9Z" {...props} />
  );
};
