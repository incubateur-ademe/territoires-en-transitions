import {MutableRefObject} from 'react';
import html2canvas from 'html2canvas';
import {Button, ButtonProps} from '@tet/ui';

import {downloadFromCanvas} from '../../utils/downloadFromCanvas';

type DownloadCanvasButtonProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
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
  const handleDownload = () => {
    if (containerRef && containerRef.current) {
      html2canvas(containerRef.current, {scale: 2}).then(canvas => {
        downloadFromCanvas(canvas, fileName, fileType);
      });
      if (props.onClick) props.onClick();
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
