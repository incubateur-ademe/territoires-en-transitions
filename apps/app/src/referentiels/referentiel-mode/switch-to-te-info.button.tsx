import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';

const HELP_LINK =
  'https://aide.territoiresentransitions.fr/fr/article/nouveau-referentiel-climat-ressources-faq-1751rib/';

export const SwitchToTeInfoButton = () => (
  <p className="mb-2 flex items-center gap-1">
    {"Plus d'infos sur"}
    <Button external variant="link" size="sm" href={HELP_LINK}>
      {appLabels.referentielTeModeReadonlyLinkLabel}
    </Button>
    {'ou votre espace collaboratif ADEME.'}
  </p>
);
