import { useEffect, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Button } from '@tet/ui';
import { saveBlob } from '../shared/preuves/Bibliotheque/saveBlob';
import DocumentToExport from './DocumentToExport';

const TEST_MODE = true;

type ExportPDFButtonType = {
  content: JSX.Element;
  fileName: string;
};

const ExportPDFButton = ({ content, fileName }: ExportPDFButtonType) => {
  const [instance, updateInstance] = usePDF({ document: undefined });
  const [isDownloadRequested, setIsDownloadRequested] = useState(false);

  useEffect(() => {
    if (instance.blob && isDownloadRequested) {
      if (TEST_MODE && instance.url) {
        window.open(instance.url, '_blank');
      } else {
        saveBlob(instance.blob, `${fileName}.pdf`);
      }
      setIsDownloadRequested(false);
    }
  }, [instance.blob, isDownloadRequested]);

  return (
    <Button
      icon="download-fill"
      title="Exporter en PDF"
      variant="white"
      size="xs"
      loading={instance.loading}
      onClick={() => {
        updateInstance(<DocumentToExport content={content} />);
        setIsDownloadRequested(true);
      }}
    />
  );
};

export default ExportPDFButton;
