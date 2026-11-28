import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

type Props = {
  fiche: Pick<FicheListItem, 'id' | 'restreint' | 'sousActionsCount'>;
  planId?: number;
  /** `false` : affiche le compteur sans navigation (ex. sélection groupée). */
  canNavigate?: boolean;
};

/**
 * Mention « N sous-actions » d'une action listée : ouvre l'action sur son
 * onglet « Sous-actions ». Avec le périmètre « Actions et sous-actions », N ne
 * compte que les sous-actions qui correspondent aux filtres.
 */
export const FicheSousActionsCountLink = ({
  fiche,
  planId,
  canNavigate = true,
}: Props) => {
  const router = useRouter();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const count = fiche.sousActionsCount ?? 0;
  const isNotReadable =
    !!fiche.restreint &&
    !hasCollectivitePermission('plans.fiches.read_confidentiel');

  if (count === 0) {
    return null;
  }

  if (isNotReadable || !canNavigate) {
    return appLabels.sousAction({ count });
  }

  const href = makeCollectiviteActionUrl({
    // collectivité courante, comme le lien de la carte (fiches partagées)
    collectiviteId,
    ficheUid: fiche.id.toString(),
    content: 'sous-actions',
    planId,
  });
  const label = appLabels.sousAction({ count });
  const dataTest = 'plans.fiches.sous-actions-count-link';

  return (
    <Button
      variant="link"
      size="xs"
      icon="node-tree"
      iconPosition="left"
      onClick={(evt: MouseEvent<HTMLButtonElement>) => {
        // Empêche la navigation du lien de la carte qui contient le bouton.
        evt.preventDefault();
        router.push(href);
      }}
      data-test={dataTest}
    >
      {label}
    </Button>
  );
};
