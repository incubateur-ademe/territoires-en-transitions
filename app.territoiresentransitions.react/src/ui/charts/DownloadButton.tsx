import {useTracker} from 'core-logic/hooks/useTracker';
import {MutableRefObject} from 'react';
import {downloadFromCanvas} from './utils';
import html2canvas from 'html2canvas';

/**
 * Bouton de téléchargement d'un élément identifié par une ref
 *
 * @param containerRef MutableRefObject<HTMLDivElement | null>
 * @param fileName string
 * @param fileType 'png' | 'jpg' | 'jpeg'
 */

type DownloadButtonProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  fileName: string;
  fileType: 'png' | 'jpg' | 'jpeg';
};

const DownloadButton = ({
  containerRef,
  fileName,
  fileType,
}: DownloadButtonProps): JSX.Element => {
  const tracker = useTracker();

  const handleDownload = () => {
    if (containerRef && containerRef.current) {
      html2canvas(containerRef.current).then(canvas => {
        downloadFromCanvas(canvas, fileName, fileType);
      });
    }
    tracker({fonction: 'graphique', action: 'telechargement'});
  };

  return (
    <button
      className="fr-btn fr-btn--sm fr-btn--secondary fr-fi-download-line"
      onClick={handleDownload}
    />
  );
};

export default DownloadButton;
