import {
  SaveScoreModal,
  SaveScoreProps,
} from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { Button } from '@tet/ui';
import { useState } from 'react';

type SaveScoreButtonProps = SaveScoreProps & {
  label?: string;
  when?: 'now' | 'before';
  variant?: 'primary' | 'outlined';
};

const SaveScoreButton = ({
  referentielId,
  collectiviteId,
  label = "Figer l'état des lieux",
  when = 'now',
  variant = 'primary',
}: SaveScoreButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        icon="camera-line"
        variant={variant}
        size="sm"
        className="whitespace-nowrap"
        onClick={() => setIsOpen(true)}
        data-test="referentiels.snapshots.figer-referentiel-button"
      >
        {label}
      </Button>
      {isOpen && (
        <SaveScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{
            isOpen,
            setIsOpen,
          }}
          when={when}
        />
      )}
    </>
  );
};

export default SaveScoreButton;
