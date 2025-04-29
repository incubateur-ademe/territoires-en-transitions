import { useBaseToast } from '@/app/core-logic/hooks/useBaseToast';
import { Button, ButtonProps } from '@/ui';
import { usePDF } from '@react-pdf/renderer';
import * as Sentry from '@sentry/nextjs';
import { useEffect, useState } from 'react';
import { saveBlob } from '../../referentiels/preuves/Bibliotheque/saveBlob';
import DocumentToExport from './DocumentToExport';

const TEST_MODE = true;

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
  const [isLoading, setIsLoading] = useState(false);

  const { setToast, renderToast } = useBaseToast();

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

  useEffect(() => {
    setIsLoading(instance.loading);
  }, [instance.loading]);

  useEffect(() => {
    if (instance.error !== null) {
      Sentry.captureException(new Error(`Error generating pdf: ${instance.error}`));
      setToast('error', "Une erreur est survenue lors de l'export");
      setIsLoading(false);
    }
  }, [instance.error]);

  return (
    <>
      <Button
        loading={isLoading}
        disabled={disabled || (!requestData && !content)}
        onClick={() => {
          setIsLoading(true);
          handleDownloadRequest();
          if (!requestData && content)
            updateInstance(<DocumentToExport content={content} />);
          onClick?.();
        }}
        {...{ title, variant, size, icon, iconPosition }}
      >
        {children}
      </Button>
      {renderToast()}
    </>
  );
};

export default ExportPDFButton;
