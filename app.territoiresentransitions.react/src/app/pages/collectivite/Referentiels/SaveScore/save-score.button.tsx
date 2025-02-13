import SaveScoreModal, {
  SaveScoreProps,
} from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { Button } from '@/ui';
import { useState } from 'react';

const SaveScoreButton = ({ referentielId, collectiviteId }: SaveScoreProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        icon="save-3-line"
        variant="primary"
        size="sm"
        className="whitespace-nowrap"
        onClick={() => setIsOpen(true)}
      >
        Figer le référentiel
      </Button>
      {isOpen && (
        <SaveScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{
            isOpen,
            setIsOpen: (value: boolean) => {
              setIsOpen(value);
            },
          }}
        />
      )}
    </>
  );
};

export default SaveScoreButton;
