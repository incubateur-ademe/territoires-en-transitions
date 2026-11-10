import { appLabels } from '@/app/labels/catalog';
import { Alert, Button, Event, useEventTracker } from '@tet/ui';
import useLocalStorage from 'react-use/lib/useLocalStorage';

/**
 * Clé propre au bandeau : `useDismissBannerInfo` partage la sienne avec la
 * bannière d'information globale, qui l'écraserait.
 */
const STORAGE_KEY = 'tet_trajectoire_snbc3_bandeau_ferme';

/** Bandeau de transition vers la SNBC 3, qu'on ferme une fois pour toutes. */
export const Snbc3TransitionBanner = ({
  onOpenChangements,
}: {
  onOpenChangements: () => void;
}) => {
  const [isDismissed, setIsDismissed] = useLocalStorage<boolean>(
    STORAGE_KEY,
    false
  );
  const trackEvent = useEventTracker();

  if (isDismissed) {
    return null;
  }

  return (
    <Alert
      state="info"
      className="text-left"
      title={appLabels.trajectoireSnbc3BandeauTitre}
      description={appLabels.trajectoireSnbc3BandeauDescription}
      footer={
        <Button
          size="sm"
          variant="underlined"
          onClick={() => {
            trackEvent(Event.trajectoire.snbc3.openChangements, {
              origine: 'bandeau',
            });
            onOpenChangements();
          }}
          dataTest="indicateurs.trajectoires.snbc3.bandeau-changements"
        >
          {appLabels.trajectoireSnbc3CeQuiChange}
        </Button>
      }
      action={
        <Button
          variant="unstyled"
          size="xs"
          icon="close-line"
          title={appLabels.trajectoireSnbc3BandeauFermer}
          aria-label={appLabels.trajectoireSnbc3BandeauFermer}
          onClick={() => {
            trackEvent(Event.trajectoire.snbc3.dismissBandeau);
            setIsDismissed(true);
          }}
          dataTest="indicateurs.trajectoires.snbc3.bandeau-fermer"
        />
      }
    />
  );
};
