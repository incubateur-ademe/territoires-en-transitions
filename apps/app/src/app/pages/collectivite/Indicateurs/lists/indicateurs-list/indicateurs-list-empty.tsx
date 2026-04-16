import { CreateIndicateurModal } from '@/app/plans/fiches/show-fiche/content/indicateurs/create-indicateur.modal';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateursListParamOption,
  makeCollectiviteTousLesIndicateursUrl,
} from '@/app/app/paths';
import PictoDataViz from '@/app/ui/pictogrammes/PictoDataViz';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonProps, EmptyCard, Event, useEventTracker } from '@tet/ui';
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
    title: appLabels.indicateurVideFavoris,
    description: appLabels.indicateurVideFavorisDescription,
  },
  perso: {
    title: appLabels.indicateurVidePersonnalise,
  },
  'mes-indicateurs': {
    title: appLabels.indicateurVideMesIndicateurs,
    description: appLabels.indicateurVideMesIndicateursDescription,
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
  const isValidEmptyListId = (id: string): id is EmptyListId =>
    (validEmptyListId as readonly string[]).includes(id);

  return !isFiltered && isValidEmptyListId(listId) ? (
    <IndicateursListEmptyCustom listId={listId} />
  ) : (
    <IndicateursListNoResults setIsSettingsOpen={setIsSettingsOpen} />
  );
};

/** Affiche un message particulier en fonction de la liste concernée */
const IndicateursListEmptyCustom = ({ listId }: { listId: EmptyListId }) => {
  const tracker = useEventTracker();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const router = useRouter();

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const actions: ButtonProps[] = [
    {
      children: appLabels.indicateurVideParcourir,
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

  if (
    hasCollectivitePermission('indicateurs.indicateurs.create') &&
    listId === 'perso'
  ) {
    actions[0].variant = 'outlined';
    actions.push({
      children: appLabels.indicateurVideCreerPersonnalise,
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
        className="m-auto whitespace-break-spaces"
        actions={actions}
      />
      {isNewIndicateurOpen && (
        <CreateIndicateurModal
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
          children: appLabels.indicateurVideModifierFiltre,
          onClick: () => setIsSettingsOpen(true),
        },
      ]
    : undefined;

  return (
    <EmptyCard
      className="m-auto"
      picto={(props) => <PictoDataViz {...props} />}
      title={appLabels.indicateurVideAucunResultat}
      actions={actions}
      variant="transparent"
    />
  );
};
