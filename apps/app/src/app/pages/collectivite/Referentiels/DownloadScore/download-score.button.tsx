import { DownloadScoreModal } from '@/app/app/pages/collectivite/Referentiels/DownloadScore/download-score.modal';
import { SaveScoreProps } from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { Button } from '@tet/ui';
import { useState } from 'react';

type DownloadScoreButtonProps = SaveScoreProps & {
  label?: string;
};

const DownloadScoreButton = ({
  referentielId,
  collectiviteId,
  label = 'Télécharger',
}: DownloadScoreButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        icon="download-line"
        variant="primary"
        size="sm"
        className="whitespace-nowrap"
        onClick={() => setIsOpen(true)}
        data-test="referentiels.snapshots.figer-referentiel-button"
      >
        {label}
      </Button>
      {isOpen && (
        <DownloadScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{
            isOpen,
            setIsOpen,
          }}
        />
      )}
    </>
  );
};

export default DownloadScoreButton;
