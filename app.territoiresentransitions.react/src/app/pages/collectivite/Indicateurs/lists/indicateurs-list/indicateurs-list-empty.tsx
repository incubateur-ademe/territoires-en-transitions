import { useCurrentCollectivite } from '@/api/collectivites';
import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import {
  IndicateursListParamOption,
  makeCollectiviteTousLesIndicateursUrl,
} from '@/app/app/paths';
import PictoDataViz from '@/app/ui/pictogrammes/PictoDataViz';
import { ButtonProps, EmptyCard, Event, useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const validEmptyListId = [
  'collectivite',
  'perso',
  'mes-indicateurs',
] as const;
export type EmptyListId = (typeof validEmptyListId)[number];

const messageByListId: Record<
  EmptyListId,
  { title: string; description?: string }
> = {
  collectivite: {
    title: 'Votre collectivité n’a pas encore d’indicateurs favoris',
    description:
      'Ajoutez en à cet espace en utilisant l’icône “étoile” sur les pages indicateurs.',
  },
  perso: {
    title: 'Votre collectivité n’a pas encore d’indicateurs personnalisés',
  },
  'mes-indicateurs': {
    title: "Vous n'avez aucun indicateur associé à votre nom",
    description:
      'Parcourez les indicateurs pour vous assigner en tant que pilote.\nCela vous facilitera le suivi et la mise à jour !',
  },
};

/**
 * Affiche un message quand la liste est vide en distinguant le cas où le
 * filtre par défaut de la liste (par exemple "Mes indicateurs") ne donne pas de
 * résultats et le cas où les critères supplémentaires ne donnent pas de
 * résultats.
 */
export const IndicateursListEmpty = ({
  isFiltered,
  listId,
  setIsSettingsOpen,
}: {
  isFiltered: boolean;
  listId: IndicateursListParamOption;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}) => {
  return !isFiltered && validEmptyListId.includes(listId as EmptyListId) ? (
    <IndicateursListEmptyCustom listId={listId as EmptyListId} />
  ) : (
    <IndicateursListNoResults setIsSettingsOpen={setIsSettingsOpen} />
  );
};

/** Affiche un message particulier en fonction de la liste concernée */
const IndicateursListEmptyCustom = ({ listId }: { listId: EmptyListId }) => {
  const tracker = useEventTracker();
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const router = useRouter();

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const actions: ButtonProps[] = [
    {
      children: 'Parcourir les indicateurs',
      onClick: () => {
        tracker(Event.indicateurs.viewIndicateursList);
        router.push(
          makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          })
        );
      },
    },
  ];

  if (!isReadOnly && listId === 'perso') {
    actions[0].variant = 'outlined';
    actions.push({
      children: 'Créer un indicateur personnalisé',
      onClick: () => setIsNewIndicateurOpen(true),
    });
  }

  const message = messageByListId[listId];

  return (
    <>
      <EmptyCard
        picto={(props) => <PictoDataViz {...props} />}
        title={message.title}
        description={message.description}
        className="whitespace-break-spaces"
        actions={actions}
      />
      {isNewIndicateurOpen && (
        <ModaleCreerIndicateur
          isOpen={isNewIndicateurOpen}
          setIsOpen={setIsNewIndicateurOpen}
          isFavoriCollectivite
        />
      )}
    </>
  );
};

/** Affiche un message quand il n'y a pas de résultats */
export const IndicateursListNoResults = ({
  setIsSettingsOpen,
}: {
  setIsSettingsOpen?: (isOpen: boolean) => void;
}) => {
  const actions = setIsSettingsOpen
    ? [
        {
          children: 'Modifier le filtre',
          onClick: () => setIsSettingsOpen(true),
        },
      ]
    : undefined;

  return (
    <EmptyCard
      picto={(props) => <PictoDataViz {...props} />}
      title="Aucun indicateur ne correspond à votre recherche"
      actions={actions}
      variant="transparent"
    />
  );
};
