import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { useGetFiche } from '../FicheAction/data/use-get-fiche';
import { FicheActionPdfContent } from './ExportFicheActionButton';
import { TSectionsValues } from './utils';

/** Timeout in ms before considering a fiche export as failed */
const FICHE_LOAD_TIMEOUT = 30000;

type FicheActionPdfWrapperProps = {
  ficheId: number;
  options: TSectionsValues;
  generateContent: (ficheId: number, content: JSX.Element) => void;
  onError: (ficheId: number) => void;
};

const FicheActionPdfWrapper = ({
  ficheId,
  options,
  generateContent,
  onError,
}: FicheActionPdfWrapperProps) => {
  const { data: fiche, isError, isLoading } = useGetFiche({ id: ficheId });
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Report error if fetching fiche failed
    if (isError && !hasCalledRef.current) {
      hasCalledRef.current = true;
      onError(ficheId);
    }
  }, [isError, ficheId, onError]);

  // Reset ref when ficheId changes
  useEffect(() => {
    hasCalledRef.current = false;
  }, [ficheId]);

  if (!fiche || isLoading) {
    return null;
  }

  return (
    <FicheActionPdfContent
      fiche={fiche}
      options={options}
      generateContent={(content) => {
        if (!hasCalledRef.current) {
          hasCalledRef.current = true;
          generateContent(ficheId, content);
        }
      }}
    />
  );
};

type Props = {
  fichesIds: number[];
  options: TSectionsValues;
  disabled?: boolean;
  onDownloadEnd?: () => void;
};

type ContentMap = Map<number, JSX.Element>;

const ExportFicheActionGroupeesButton = ({
  fichesIds,
  options,
  disabled = false,
  onDownloadEnd,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();

  const [isDataRequested, setIsDataRequested] = useState(false);
  // Use a Map to track content by ficheId for reliable updates
  const [contentMap, setContentMap] = useState<ContentMap>(new Map());
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());

  // Track the current request to handle cancellation
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileName = `actions-${collectiviteId}-${Date.now()}`;

  // Calculate ready content array only when all fiches are loaded
  const isAllLoaded =
    fichesIds.length > 0 &&
    fichesIds.every((id) => contentMap.has(id) || failedIds.has(id));
  const hasFailures = failedIds.size > 0;
  const successfulContent =
    isAllLoaded && !hasFailures
      ? fichesIds.map((id) => contentMap.get(id)!).filter(Boolean)
      : undefined;

  // Reset state when starting a new request
  const handleRequestData = useCallback(() => {
    // Cancel any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Increment request ID to invalidate previous requests
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setContentMap(new Map());
    setFailedIds(new Set());
    setIsDataRequested(true);

    // Set timeout to handle hung exports
    timeoutRef.current = setTimeout(() => {
      if (requestIdRef.current === currentRequestId) {
        setToast(
          'error',
          "L'export a pris trop de temps. Veuillez réessayer avec moins de fiches."
        );
        setIsDataRequested(false);
        setContentMap(new Map());
        setFailedIds(new Set());
      }
    }, FICHE_LOAD_TIMEOUT);
  }, [setToast]);

  // Handle content generation with proper immutable updates
  const handleGenerateContent = useCallback(
    (ficheId: number, content: JSX.Element) => {
      setContentMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(ficheId, content);
        return newMap;
      });
    },
    []
  );

  // Handle errors for individual fiches
  const handleError = useCallback((ficheId: number) => {
    setFailedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(ficheId);
      return newSet;
    });
  }, []);

  // Clear timeout and reset state when all content is ready or on error
  useEffect(() => {
    if (isAllLoaded) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (hasFailures) {
        setToast(
          'error',
          `Certaines fiches n'ont pas pu être exportées (${failedIds.size}/${fichesIds.length})`
        );
        setIsDataRequested(false);
        setContentMap(new Map());
        setFailedIds(new Set());
      }
    }
  }, [isAllLoaded, hasFailures, failedIds.size, fichesIds.length, setToast]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDownloadEnd = useCallback(() => {
    setIsDataRequested(false);
    setContentMap(new Map());
    setFailedIds(new Set());
    onDownloadEnd?.();
  }, [onDownloadEnd]);

  return (
    <>
      <ExportPDFButton
        fileName={fileName}
        content={successfulContent}
        requestData={handleRequestData}
        size="md"
        variant="primary"
        disabled={disabled}
        onDownloadEnd={handleDownloadEnd}
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested &&
        fichesIds.map((id) => (
          <FicheActionPdfWrapper
            key={id}
            ficheId={id}
            options={options}
            generateContent={handleGenerateContent}
            onError={handleError}
          />
        ))}
    </>
  );
};

export default ExportFicheActionGroupeesButton;
