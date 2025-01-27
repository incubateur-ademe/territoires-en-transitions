import { Button } from '@/ui';
import SaveScoreModal, { SaveScoreProps } from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.modal';

const SaveScoreButton = ({ referentielId, collectiviteId }: SaveScoreProps) => {
  return (
    <SaveScoreModal collectiviteId={collectiviteId} referentielId={referentielId}>
      <Button icon="save-3-line" variant="primary" size="sm" className="whitespace-nowrap">
        Figer le référentiel
      </Button>
    </SaveScoreModal>
  );
};

export default SaveScoreButton;
