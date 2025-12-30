import { Button, useEventTracker } from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';
import { useFicheContext } from '../../context/fiche-context';

const CreateIndicateurButton = ({
  toggleAction,
}: {
  toggleAction: () => void;
}) => {
  const { isReadonly, indicateurs } = useFicheContext();

  const tracker = useEventTracker();

  if (indicateurs.canCreate === false || isReadonly) {
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
  const { indicateurs } = useFicheContext();

  return (
    <>
      <CreateIndicateurButton
        toggleAction={() => indicateurs.toggleAction('creating')}
      />
      <AssociateIndicateursButton
        toggleAction={() => indicateurs.toggleAction('associating')}
      />
    </>
  );
};
