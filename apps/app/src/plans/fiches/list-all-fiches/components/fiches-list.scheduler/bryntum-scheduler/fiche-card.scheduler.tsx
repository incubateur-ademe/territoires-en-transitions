import classNames from 'classnames';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';

import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { FicheActionCardProps } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import ModifierFicheModale from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/ModifierFicheModale';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Button, Card } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';

type Props = Pick<
  FicheActionCardProps,
  'ficheAction' | 'currentCollectivite' | 'currentUserId'
>;

/** Carte d'une fiche à utiliser dans le scheduler  */
export const FicheCardScheduler = ({
  ficheAction: fiche,
  currentCollectivite,
  currentUserId,
}: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isNotClickable =
    currentCollectivite.niveauAcces === null && !!fiche.restreint;

  const cardRef = useRef<HTMLAnchorElement>(null);

  const contentRef = useRef<HTMLAnchorElement>(null);

  const [cardWidth, setCardWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Permet de comparer la taille réelle de la carte qui match la durée de la fiche,
  // et la taille du contenu (titre, statut, pilotes) pour savoir si on doit
  // truncate le titre ou pas
  useLayoutEffect(() => {
    const cardWidth = cardRef?.current?.getBoundingClientRect().width;
    setCardWidth(cardWidth ?? 0);
    const contentWidth = contentRef?.current?.getBoundingClientRect().width;
    setContentWidth(contentWidth ?? 0);
  }, []);

  // Href est donné à la carte et au contenu afin que le clic fonctionne partout.
  // Comme le contenu est en position absolute, il n'y a pas de double click quand
  // on clique sur le contenu qui est dans la carte.
  // On fait cela pour garder le click droit "ouvrir dans un nouvel onglet" partout
  // où l'utilisateur s'attend à pouvoir cliquer.
  const href = fiche.plans?.[0]?.id
    ? makeCollectivitePlanActionFicheUrl({
        collectiviteId: currentCollectivite.collectiviteId,
        ficheUid: fiche.id.toString(),
        planActionUid: fiche.plans[0].id.toString(),
      })
    : makeCollectiviteFicheNonClasseeUrl({
        collectiviteId: currentCollectivite.collectiviteId,
        ficheUid: fiche.id.toString(),
      });

  const canUpdate = isFicheEditableByCollectiviteUser(
    fiche,
    currentCollectivite,
    currentUserId
  );

  return (
    <div className="group relative flex">
      {/* Card background qui représente la taille exacte de l'event */}
      <Card
        ref={cardRef}
        className={cn('h-15 absolute inset-0 m-0', {
          'group-hover:border-primary-3 group-hover:bg-primary-1':
            !isNotClickable,
        })}
        href={href}
        disabled={isNotClickable}
      />
      {/* Contenu principal en overflow de l'event */}
      <div className="sticky left-0 flex items-center">
        <Link
          ref={contentRef}
          data-test="FicheActionCarte"
          onClick={(e) => isNotClickable && e.preventDefault()}
          href={href}
          className={cn('flex items-center gap-3 p-4 active:!bg-transparent', {
            'cursor-default': isNotClickable,
          })}
        >
          <span
            title={generateTitle(fiche.titre)}
            className={classNames(
              'w-max text-base font-bold text-primary-9 whitespace-normal line-clamp-1',
              {
                'max-w-lg': contentWidth > cardWidth,
              }
            )}
          >
            {generateTitle(fiche.titre)}
          </span>

          {fiche.statut && <BadgeStatut statut={fiche.statut} size="sm" />}

          {fiche.pilotes && fiche.pilotes.length > 0 && (
            <ListWithTooltip
              title="Pilotes"
              list={
                fiche.pilotes
                  .map((p) => p?.nom)
                  .filter((nom) => Boolean(nom)) as string[]
              }
              icon="user-line"
              className="text-primary-8 text-sm font-normal"
            />
          )}
        </Link>
        {/* Menu d'édition et de suppression */}
        {canUpdate && (
          <div className="hidden group-hover:flex absolute left-full gap-2 py-3 pl-2">
            {isEditOpen && (
              <ModifierFicheModale
                initialFiche={fiche}
                isOpen={isEditOpen}
                setIsOpen={() => setIsEditOpen(!isEditOpen)}
              />
            )}
            <Button
              data-test="EditerFicheBouton"
              id={`fiche-${fiche.id}-edit-button`}
              icon="edit-line"
              title="Modifier la fiche"
              variant="grey"
              size="xs"
              onClick={() => setIsEditOpen(!isEditOpen)}
            />
            <DeleteOrRemoveFicheSharingModal fiche={fiche} />
          </div>
        )}
      </div>
    </div>
  );
};
