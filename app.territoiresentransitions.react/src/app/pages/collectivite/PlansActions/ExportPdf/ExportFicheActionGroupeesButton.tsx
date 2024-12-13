import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useEventTracker } from '@/ui';
import { useEffect, useState } from 'react';
import { useFicheAction } from '../FicheAction/data/useFicheAction';
import { FicheActionPdfContent } from './ExportFicheActionButton';

type FicheActionPdfWrapperProps = {
  ficheId: number;
  generateContent: (content: JSX.Element) => void;
};

const FicheActionPdfWrapper = ({
  ficheId,
  generateContent,
}: FicheActionPdfWrapperProps) => {
  const { data: fiche } = useFicheAction(ficheId.toString());

  return (
    fiche && (
      <FicheActionPdfContent fiche={fiche} generateContent={generateContent} />
    )
  );
};

const ExportFicheActionGroupeesButton = ({
  fichesIds,
}: {
  fichesIds: number[];
}) => {
  const collectivite = useCurrentCollectivite()!;
  const tracker = useEventTracker('app/actions-groupees-fiches-action');

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element[] | undefined>(undefined);

  const fileName = `fiches-actions-${collectivite.collectivite_id}`;

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
        icon="file-pdf-line"
        variant="outlined"
        onClick={() =>
          tracker('export_PDF_telechargement_groupe', {
            collectivite_id: collectivite.collectivite_id,
          })
        }
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested &&
        fichesIds.map((id) => (
          <FicheActionPdfWrapper
            key={id}
            ficheId={id}
            generateContent={(newContent) => {
              setContent((prevState) => [...(prevState ?? []), newContent]);
            }}
          />
        ))}
    </>
  );
};

export default ExportFicheActionGroupeesButton;
