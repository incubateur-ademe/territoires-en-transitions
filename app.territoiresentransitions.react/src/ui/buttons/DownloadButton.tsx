import {MutableRefObject} from 'react';
import {downloadFromCanvas} from '../../utils/downloadFromCanvas';
import html2canvas from 'html2canvas';

/**
 * Bouton de téléchargement d'un élément identifié par une ref
 *
 * @param containerRef MutableRefObject<HTMLDivElement | null>
 * @param fileName string
 * @param fileType 'png' | 'jpg' | 'jpeg'
 * @param onClick
 */

type DownloadButtonProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  fileName: string;
  fileType: 'png' | 'jpg' | 'jpeg';
  onClick?: () => void;
};

const DownloadButton = ({
  containerRef,
  fileName,
  fileType,
  onClick,
}: DownloadButtonProps): JSX.Element => {
  const handleDownload = () => {
    if (containerRef && containerRef.current) {
      html2canvas(containerRef.current, {scale: 2}).then(canvas => {
        downloadFromCanvas(canvas, fileName, fileType);
      });
      if (onClick) onClick();
    }
  };

  return (
    <button
      className="fr-btn fr-btn--sm fr-btn--secondary fr-fi-download-line"
      onClick={handleDownload}
    />
  );
};

export default DownloadButton;
