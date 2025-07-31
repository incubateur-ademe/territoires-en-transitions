import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Checkbox } from '@/ui';
import { useRef } from 'react';
import { Textarea, useUpsertEtape } from './etape';
import {
  EtapesProvider,
  useEtapesDispatch,
  useEtapesState,
} from './etapes-context';
import EtapesList from './etapes-list';
import { useGetEtapes } from './use-get-etapes';

type Props = {
  fiche: Fiche;
  isReadonly: boolean;
};

/** Étapes d'une fiche action */
const Etapes = (props: Props) => {
  const { fiche } = props;

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
      <EtapesWithContext {...props} />
    </EtapesProvider>
  );
};

export default Etapes;

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
const EtapesWithContext = ({ fiche, isReadonly }: Props) => {
  const { etapes } = useEtapesState();

  const dispatchEtapes = useEtapesDispatch();

  const { mutate: createEtape, isPending } = useUpsertEtape();

  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  const createRef = useRef<HTMLTextAreaElement>(null);

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
            // Remet immédiatement le focus sur le champ de création d'étape
            if (createRef.current) {
              // set timeout pour permettre à isPending de se mettre à jour
              // et éviter le focus si le champ est désactivé
              setTimeout(() => createRef.current?.focus(), 25);
            }
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
          <Textarea
            ref={createRef}
            placeholder="Commencer à écrire pour ajouter une étape"
            disabled={isReadonly || isPending}
            onBlur={handleCreateEtape}
          />
        </div>
      )}
    </div>
  );
};
