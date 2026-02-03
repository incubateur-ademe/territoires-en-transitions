import { useToastContext } from '@/app/utils/toast/toast-context';
import { usePDF } from '@react-pdf/renderer';
import * as Sentry from '@sentry/nextjs';
import { Button, ButtonProps } from '@tet/ui';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { saveBlob } from '../../referentiels/preuves/Bibliotheque/saveBlob';
import DocumentToExport from './DocumentToExport';

const TEST_MODE = false;

/** Timeout in ms for PDF generation before showing an error */
const PDF_GENERATION_TIMEOUT = 60000;

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

  const { setToast } = useToastContext();

  // Track timeout for PDF generation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);

  // Clear timeout helper
  const clearGenerationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset state helper
  const resetState = useCallback(() => {
    clearGenerationTimeout();
    setIsDownloadRequested(false);
    setIsLoading(false);
  }, [clearGenerationTimeout]);

  const handleDownloadRequest = useCallback(() => {
    // Increment request ID to invalidate stale callbacks
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setIsDownloadRequested(true);
    requestData?.();

    // Set timeout to prevent indefinite loading
    clearGenerationTimeout();
    timeoutRef.current = setTimeout(() => {
      if (requestIdRef.current === currentRequestId) {
        Sentry.captureException(new Error('PDF generation timeout exceeded'));
        setToast(
          'error',
          'La génération du PDF a pris trop de temps. Veuillez réessayer.'
        );
        resetState();
        onDownloadEnd?.();
      }
    }, PDF_GENERATION_TIMEOUT);
  }, [
    requestData,
    clearGenerationTimeout,
    resetState,
    setToast,
    onDownloadEnd,
  ]);

  // Update PDF instance when content changes
  useEffect(() => {
    if (
      content &&
      ((Array.isArray(content) && content.length) || !Array.isArray(content)) &&
      !!requestData
    ) {
      updateInstance(<DocumentToExport content={content} />);
    }
  }, [content, requestData, updateInstance]);

  // Handle successful PDF generation
  useEffect(() => {
    if (instance.blob && isDownloadRequested) {
      clearGenerationTimeout();

      if (TEST_MODE && instance.url) {
        window.open(instance.url, '_blank');
      } else {
        saveBlob(instance.blob, `${fileName}.pdf`);
      }
      setIsDownloadRequested(false);
      setIsLoading(false);
      onDownloadEnd?.();
    }
  }, [
    instance.blob,
    isDownloadRequested,
    fileName,
    onDownloadEnd,
    instance.url,
    clearGenerationTimeout,
  ]);

  // Sync loading state with PDF instance
  useEffect(() => {
    // Only update if we're in a download request
    if (isDownloadRequested) {
      setIsLoading(instance.loading);
    }
  }, [instance.loading, isDownloadRequested]);

  // Handle PDF generation errors
  useEffect(() => {
    if (instance.error !== null) {
      clearGenerationTimeout();
      Sentry.captureException(
        new Error(`Error generating pdf: ${instance.error}`)
      );
      setToast('error', "Une erreur est survenue lors de l'export");
      resetState();
      onDownloadEnd?.();
    }
  }, [
    instance.error,
    clearGenerationTimeout,
    resetState,
    setToast,
    onDownloadEnd,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearGenerationTimeout();
    };
  }, [clearGenerationTimeout]);

  const handleClick = useCallback(() => {
    setIsLoading(true);
    handleDownloadRequest();
    if (!requestData && content) {
      updateInstance(<DocumentToExport content={content} />);
    }
    onClick?.();
  }, [handleDownloadRequest, requestData, content, updateInstance, onClick]);

  return (
    <Button
      loading={isLoading}
      disabled={disabled || (!requestData && !content)}
      onClick={handleClick}
      {...{ title, variant, size, icon, iconPosition }}
    >
      {children}
    </Button>
  );
};

export default ExportPDFButton;
