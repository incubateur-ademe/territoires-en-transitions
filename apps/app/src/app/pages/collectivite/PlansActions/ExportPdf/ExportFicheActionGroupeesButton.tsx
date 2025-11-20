import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useEffect, useState } from 'react';
import { useGetFiche } from '../FicheAction/data/use-get-fiche';
import { FicheActionPdfContent } from './ExportFicheActionButton';
import { TSectionsValues } from './utils';

type FicheActionPdfWrapperProps = {
  ficheId: number;
  options: TSectionsValues;
  generateContent: (content: JSX.Element) => void;
};

const FicheActionPdfWrapper = ({
  ficheId,
  options,
  generateContent,
}: FicheActionPdfWrapperProps) => {
  const { data: fiche } = useGetFiche({ id: ficheId });

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
  options: TSectionsValues;
  disabled?: boolean;
  onDownloadEnd?: () => void;
};

const ExportFicheActionGroupeesButton = ({
  fichesIds,
  options,
  disabled = false,
  onDownloadEnd,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element[] | undefined>(undefined);

  const fileName = `fiches-actions-${collectiviteId}-${Date.now()}`;

  useEffect(() => {
    if (content?.length === fichesIds.length) {
      setIsDataRequested(false);
    }
  }, [content?.length, fichesIds.length]);

  useEffect(() => setContent(undefined), [isDataRequested]);

  return (
    <>
      <ExportPDFButton
        fileName={fileName}
        content={content?.length === fichesIds.length ? content : undefined}
        requestData={() => setIsDataRequested(true)}
        size="md"
        variant="primary"
        disabled={disabled}
        onDownloadEnd={onDownloadEnd}
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested &&
        fichesIds.map((id, index) => (
          <FicheActionPdfWrapper
            key={id}
            ficheId={id}
            options={options}
            generateContent={(newContent) => {
              setContent((prevState) => {
                const prevContent = prevState ?? [];
                prevContent[index] = newContent;
                return prevContent;
              });
            }}
          />
        ))}
    </>
  );
};

export default ExportFicheActionGroupeesButton;
