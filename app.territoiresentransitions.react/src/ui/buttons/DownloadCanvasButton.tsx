import { Button, ButtonProps } from '@tet/ui';
import html2canvas from 'html2canvas';
import { MouseEvent, RefObject } from 'react';

import { downloadFromCanvas } from '../../utils/downloadFromCanvas';

type DownloadCanvasButtonProps = {
  containerRef: RefObject<HTMLElement>;
  fileName: string;
  fileType: 'png' | 'jpg' | 'jpeg';
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
      html2canvas(containerRef.current, { scale: 2 }).then((canvas) => {
        downloadFromCanvas(canvas, fileName, fileType);
      });

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
