import { useCollectiviteId } from '@/api/collectivites';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { Event, useEventTracker } from '@/ui';
import { useEffect, useState } from 'react';
import { useGetFiche } from '../FicheAction/data/use-get-fiche';
import { FicheActionPdfContent } from './ExportFicheActionButton';
import { TSectionsValues, sectionsInitValue } from './utils';

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
  const { data: fiche } = useGetFiche(ficheId);

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
  options = sectionsInitValue,
  disabled = false,
  onDownloadEnd,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const tracker = useEventTracker();

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element[] | undefined>(undefined);

  const fileName = `fiches-actions-${collectiviteId}`;

  const selectedOptions = Object.keys(options).filter(
    (k) => options[k].isChecked === true
  );

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
          tracker(Event.fiches.exportPdfGroupe, {
            sections: selectedOptions,
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
