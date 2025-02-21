import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useEventTracker } from '@/ui';
import { useEffect, useState } from 'react';
import { useFicheAction } from '../FicheAction/data/useFicheAction';
import { FicheActionPdfContent } from './ExportFicheActionButton';
import { TSectionsValues } from './utils';

type FicheActionPdfWrapperProps = {
  ficheId: number;
  options?: TSectionsValues;
  generateContent: (content: JSX.Element) => void;
};

const FicheActionPdfWrapper = ({
  ficheId,
  options,
  generateContent,
}: FicheActionPdfWrapperProps) => {
  const { data: fiche } = useFicheAction(ficheId.toString());

  return (
    fiche && (
      <FicheActionPdfContent
        fiche={fiche}
        options={options}
        generateContent={generateContent}
      />
    )
  );
};

type Props = {
  fichesIds: number[];
  options?: TSectionsValues;
  disabled?: boolean;
  onDownloadEnd?: () => void;
};

const ExportFicheActionGroupeesButton = ({
  fichesIds,
  options,
  disabled = false,
  onDownloadEnd,
}: Props) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const tracker = useEventTracker('app/actions-groupees-fiches-action');

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element[] | undefined>(undefined);

  const fileName = `fiches-actions-${collectiviteId}`;

  useEffect(() => {
    if (content?.length === fichesIds.length) {
      setIsDataRequested(false);
    }
  }, [content?.length, fichesIds.length]);

  useEffect(() => setContent(undefined), [isDataRequested]);

  return (
    <>
      <ExportPDFButton
        {...{ fileName }}
        content={content?.length === fichesIds.length ? content : undefined}
        requestData={() => setIsDataRequested(true)}
        size="md"
        variant="primary"
        disabled={disabled}
        onClick={() =>
          tracker('export_PDF_telechargement_groupe', {
            collectiviteId,
            niveauAcces,
            role,
          })
        }
        onDownloadEnd={onDownloadEnd}
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested &&
        fichesIds.map((id) => (
          <FicheActionPdfWrapper
            key={id}
            ficheId={id}
            options={options}
            generateContent={(newContent) => {
              setContent((prevState) => [...(prevState ?? []), newContent]);
            }}
          />
        ))}
    </>
  );
};

export default ExportFicheActionGroupeesButton;
