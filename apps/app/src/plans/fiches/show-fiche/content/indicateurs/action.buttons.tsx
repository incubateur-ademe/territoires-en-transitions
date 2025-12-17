import { Button, useEventTracker } from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';
import { useFicheContext } from '../../context/fiche-context';

const CreateIndicateurButton = ({
  toggleAction,
}: {
  toggleAction: () => void;
}) => {
  const { isReadonly, canCreateIndicateur } = useFicheContext();

  const tracker = useEventTracker();

  if (canCreateIndicateur === false || isReadonly) {
    return null;
  }

  return (
    <Button
      icon="file-add-line"
      onClick={() => {
        tracker(Event.indicateurs.createIndicateurPerso);
        toggleAction();
      }}
      variant="outlined"
      size="sm"
    >
      Créer et associer un indicateur personnalisé
    </Button>
  );
};

const AssociateIndicateursButton = ({
  toggleAction,
}: {
  toggleAction: () => void;
}) => {
  return (
    <Button
      icon="link"
      onClick={() => toggleAction()}
      variant="primary"
      size="sm"
    >
      Lier des indicateurs existants
    </Button>
  );
};

export const ActionButtons = () => {
  const { toggleIndicateurAction } = useFicheContext();

  return (
    <>
      <CreateIndicateurButton
        toggleAction={() => toggleIndicateurAction('creating')}
      />
      <AssociateIndicateursButton
        toggleAction={() => toggleIndicateurAction('associating')}
      />
    </>
  );
};
