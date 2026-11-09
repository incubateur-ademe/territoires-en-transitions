import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { DemarcheListItem } from './use-filter-demarches-pcaet';

/** Le dépôt d'un Supra s'ouvre dans les écrans du dossier, en lecture seule. */
export const ConsulterDemarcheCouvranteButton = ({
  demarche,
}: {
  demarche: DemarcheListItem;
}) => (
  <Button
    href={makeCollectiviteDemarchePcaetRootUrl({
      collectiviteId: demarche.collectiviteId,
      demarcheId: demarche.id,
    })}
    variant="outlined"
    size="xs"
    icon="eye-line"
    dataTest="demarches.liste.consulter-couvrante"
  >
    {appLabels.demarcheConsulter}
  </Button>
);
