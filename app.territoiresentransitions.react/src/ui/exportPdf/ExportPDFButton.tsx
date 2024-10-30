import { useEffect, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Button } from '@tet/ui';
import { saveBlob } from '../shared/preuves/Bibliotheque/saveBlob';
import DocumentToExport from './DocumentToExport';

const TEST_MODE = true;

export type ExportPDFButtonType = {
  /** Content of the pdf - Content shouldn't be undefined if requestData isn't used */
  content: JSX.Element | undefined;
  /** Name of the generated pdf */
  fileName: string;
  /** Allows to request data to the parent component when the user requests a download */
  requestData?: () => void;
};

const ExportPDFButton = ({
  content,
  fileName,
  requestData,
}: ExportPDFButtonType) => {
  const [instance, updateInstance] = usePDF({ document: undefined });
  const [isDownloadRequested, setIsDownloadRequested] = useState(false);

  const handleDownloadRequest = () => {
    setIsDownloadRequested(true);
    requestData?.();
  };

  useEffect(() => {
    if (content && !!requestData) {
      updateInstance(<DocumentToExport content={content} />);
    }
  }, [content]);

  useEffect(() => {
    if (instance.blob && isDownloadRequested) {
      if (TEST_MODE && instance.url) {
        window.open(instance.url, '_blank');
      } else {
        saveBlob(instance.blob, `${fileName}.pdf`);
      }
      setIsDownloadRequested(false);
    }
  }, [instance.blob]);

  return (
    <Button
      icon="download-fill"
      title="Exporter en PDF"
      variant="white"
      size="xs"
      loading={instance.loading}
      disabled={!requestData && !content}
      onClick={() => {
        handleDownloadRequest();
        if (!requestData && content)
          updateInstance(<DocumentToExport content={content} />);
      }}
    />
  );
};

export default ExportPDFButton;
