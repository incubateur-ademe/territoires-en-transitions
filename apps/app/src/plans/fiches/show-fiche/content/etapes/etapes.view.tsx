import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Checkbox } from '@tet/ui';
import { EtapeTextarea, useUpsertEtape } from './etape';
import {
  EtapesProvider,
  useEtapesDispatch,
  useEtapesState,
} from './etapes-context';
import EtapesList from './etapes-list';
import { useGetEtapes } from './use-get-etapes';

import { useFicheContext } from '../../context/fiche-context';

export const EtapesView = () => {
  const { fiche } = useFicheContext();
  const { data, isLoading } = useGetEtapes(fiche.id);

  const etapes = data ?? [];

  if (isLoading) {
    return (
      <div className="h-80 w-full flex justify-center items-center">
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <EtapesProvider initialState={{ etapes }}>
      <EtapesWithContext />
    </EtapesProvider>
  );
};

/**
 * Utilisation d'un state localisé, récupéré via le context.
 * Il faut donc modifier les étapes localement via le dispatch en plus du serveur.
 *
 * Le local state permet au drag and drop de fonctionner correctement,
 * en évitant un bug sur l'animation du `dragEnd` avec le call API.
 * Normalement, nous devrions faire cela via l'optimistic update de react-query, or cela ne fonctionne pas bien.
 * Voir cette discussion pour plus d'infos: https://github.com/clauderic/dnd-kit/issues/921#issuecomment-1591744314
 * Essai avec <DragOverlay /> sans succès.
 */
const EtapesWithContext = () => {
  const { fiche, isReadonly } = useFicheContext();
  const { etapes } = useEtapesState();

  const dispatchEtapes = useEtapesDispatch();

  const { mutate: createEtape, isPending } = useUpsertEtape();

  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  const handleCreateEtape = (newTitle: string) => {
    if (newTitle.length) {
      createEtape(
        {
          ficheId: fiche.id,
          ordre: etapes.length + 1,
          nom: newTitle,
        },
        {
          onSuccess: (newEtape) => {
            dispatchEtapes({ type: 'create', payload: newEtape });
          },
        }
      );
    }
  };

  /** Liste des étapes */
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8">
      <h5 className="mb-3 text-primary-8">
        Étapes {etapes.length > 0 && `${etapesRealiseesCount}/${etapes.length}`}
      </h5>
      <SharedFicheUpdateAlert fiche={fiche} />
      <p className="mb-0 text-sm text-primary-6">
        Dans cette section, vous pouvez découper votre action comme vous le
        souhaitez !
      </p>
      <div className="h-[1px] w-full my-4 bg-grey-3" />
      <EtapesList fiche={fiche} etapes={etapes} isReadonly={isReadonly} />
      {/** Champ d'ajout d'une nouvelle étape */}
      {!isReadonly && (
        <div className="flex items-start p-4">
          <Checkbox />
          <EtapeTextarea
            placeholder="Commencer à écrire pour ajouter une étape"
            disabled={isReadonly || isPending}
            onBlur={handleCreateEtape}
          />
        </div>
      )}
    </div>
  );
};
