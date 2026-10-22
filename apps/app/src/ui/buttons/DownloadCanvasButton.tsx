import {
  downloadElementAsImage,
  ImageFileType,
} from '@/app/utils/download-element-as-image';
import { Button, ButtonProps } from '@tet/ui';
import { JSX, MouseEvent, RefObject } from 'react';

type DownloadCanvasButtonProps = {
  containerRef: RefObject<HTMLElement | null>;
  fileName: string;
  fileType: ImageFileType;
} & ButtonProps;

/** Bouton de téléchargement d'un élément identifié par une ref */
const DownloadCanvasButton = ({
  containerRef,
  fileName,
  fileType,
  variant = 'outlined',
  size = 'xs',
  icon = 'download-line',
  children,
  ...props
}: DownloadCanvasButtonProps): JSX.Element => {
  const handleDownload = (
    event: MouseEvent<HTMLAnchorElement> & MouseEvent<HTMLButtonElement>
  ) => {
    if (containerRef && containerRef.current) {
      downloadElementAsImage(containerRef.current, fileName, fileType);

      if (props.onClick) props.onClick(event);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleDownload}
      variant={variant}
      size={size}
      icon={icon}
    >
      {children}
    </Button>
  );
};

export default DownloadCanvasButton;
