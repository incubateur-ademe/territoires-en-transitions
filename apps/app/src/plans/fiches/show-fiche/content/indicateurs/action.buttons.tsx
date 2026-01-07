import { Button, useEventTracker } from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';
import { useFicheContext } from '../../context/fiche-context';

const CreateIndicateurButton = ({
  toggleAction,
  canCreateIndicateur,
}: {
  toggleAction: () => void;
  canCreateIndicateur: boolean;
}) => {
  const tracker = useEventTracker();

  if (canCreateIndicateur) {
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
  const { indicateurs, isReadonly } = useFicheContext();

  if (isReadonly) {
    return null;
  }

  return (
    <>
      <CreateIndicateurButton
        toggleAction={() => indicateurs.toggleAction('creating')}
        canCreateIndicateur={indicateurs.canCreate}
      />
      <AssociateIndicateursButton
        toggleAction={() => indicateurs.toggleAction('associating')}
      />
    </>
  );
};
