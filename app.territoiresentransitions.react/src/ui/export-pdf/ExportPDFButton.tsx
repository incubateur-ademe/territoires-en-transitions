import { Button, ButtonProps } from '@/ui';
import { usePDF } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { saveBlob } from '../../referentiels/preuves/Bibliotheque/saveBlob';
import DocumentToExport from './DocumentToExport';

const TEST_MODE = false;

export type ExportPDFButtonType = Pick<
  ButtonProps,
  | 'children'
  | 'title'
  | 'variant'
  | 'size'
  | 'icon'
  | 'iconPosition'
  | 'disabled'
> & {
  /** Content of the pdf - Content shouldn't be undefined if requestData isn't used */
  content: JSX.Element | JSX.Element[] | undefined;
  /** Name of the generated pdf */
  fileName: string;
  /** Allows to request data to the parent component when the user requests a download */
  requestData?: () => void;
  /** Action supplémentaire au click */
  onClick?: () => void;
  onDownloadEnd?: () => void;
};

const ExportPDFButton = ({
  content,
  fileName,
  children,
  title = 'Exporter en PDF',
  variant = 'white',
  size = 'xs',
  icon = 'download-fill',
  iconPosition = 'left',
  disabled,
  requestData,
  onClick,
  onDownloadEnd,
}: ExportPDFButtonType) => {
  const [instance, updateInstance] = usePDF({ document: undefined });
  const [isDownloadRequested, setIsDownloadRequested] = useState(false);

  const handleDownloadRequest = () => {
    setIsDownloadRequested(true);
    requestData?.();
  };

  useEffect(() => {
    if (
      content &&
      ((Array.isArray(content) && content.length) || !Array.isArray(content)) &&
      !!requestData
    ) {
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
      onDownloadEnd?.();
    }
  }, [instance.blob]);

  return (
    <Button
      loading={instance.loading}
      disabled={disabled || (!requestData && !content)}
      onClick={() => {
        handleDownloadRequest();
        if (!requestData && content)
          updateInstance(<DocumentToExport content={content} />);
        onClick?.();
      }}
      {...{ title, variant, size, icon, iconPosition }}
    >
      {children}
    </Button>
  );
};

export default ExportPDFButton;
