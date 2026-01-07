import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import {
  FicheListItem,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import {
  FicheNote,
  FicheNoteUpsert,
  FicheWithRelations,
} from '@tet/domain/plans';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useUpdateFiche } from '../../update-fiche/data/use-update-fiche';
import { useAnnexesFicheAction } from '../data/useAnnexesFicheAction';
import { useUpdateFichesActionLiees } from '../data/useFichesActionLiees';

type FichesLieesState = {
  list: FicheListItem[];
  isLoading: boolean;
  update: (linkedFicheIds: number[]) => void;
};

type DocumentsState = {
  list: TPreuve[] | undefined;
  isLoading: boolean;
};

type IndicateursState = {
  list: IndicateurDefinitionListItem[];
  isLoading: boolean;
  update: (indicateur: IndicateurDefinitionListItem) => Promise<void>;
  canUpdate: (indicateur: IndicateurDefinitionListItem) => boolean;
  canCreate: boolean;
  action: IndicateurActionMode;
  toggleAction: (action: IndicateurActionMode) => void;
};

type IndicateurActionMode = 'creating' | 'associating' | 'none';
type NotesState = {
  list: FicheNote[];
  upsert: (
    noteToUpsert: Omit<FicheNoteUpsert, 'dateNote'> & { dateNote: number }
  ) => Promise<void>;
  delete: (noteToDeleteId: number) => Promise<void>;
};

export type FicheContextValue = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  planId?: number;
  update: ReturnType<typeof useUpdateFiche>['mutate'];
  isUpdating: boolean;
  fichesLiees: FichesLieesState;
  documents: DocumentsState;
  indicateurs: IndicateursState;
  notes: NotesState;
};

const FicheContext = createContext<FicheContextValue | null>(null);

export const useFicheContext = () => {
  const context = useContext(FicheContext);
  if (!context) {
    throw new Error('useFicheContext must be used within a FicheProvider');
  }
  return context;
};

type FicheProviderProps = {
  fiche: FicheWithRelations;
  planId?: number;
  children: ReactNode;
};

export const FicheProvider = ({
  fiche,
  planId,
  children,
}: FicheProviderProps) => {
  const collectivite = useCurrentCollectivite();
  const user = useUser();
  const { mutateAsync: updateFiche, isPending: isUpdatePending } =
    useUpdateFiche();

  const isReadonly =
    collectivite.isReadOnly ||
    !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id) ||
    isFicheSharedWithCollectivite(fiche, collectivite.collectiviteId);

  const { data: documentsList, isLoading: isLoadingDocuments } =
    useAnnexesFicheAction(collectivite.collectiviteId, fiche.id);

  const documents: DocumentsState = {
    list: documentsList,
    isLoading: isLoadingDocuments,
  };

  const { fiches: fichesLieesList, isLoading: isLoadingFichesLiees } =
    useListFiches(collectivite.collectiviteId, {
      filters: {
        linkedFicheIds: [fiche.id],
      },
    });

  const { mutate: updateFichesLiees } = useUpdateFichesActionLiees(fiche.id);

  const fichesLiees: FichesLieesState = {
    list: fichesLieesList,
    isLoading: isLoadingFichesLiees,
    update: updateFichesLiees,
  };

  const { data, isLoading: isLoadingIndicateurs } = useListIndicateurs({
    collectiviteId: fiche.collectiviteId,
    filters: {
      ficheIds: [fiche.id],
    },
  });
  const indicateursList = data?.data ?? [];
  const updateIndicateurs = async (
    indicateur: IndicateurDefinitionListItem
  ) => {
    const currentIndicateurs = indicateursList;
    const isIndicateurAlreadyLinked =
      currentIndicateurs.some((i) => i.id === indicateur.id) ?? false;

    const updatedIndicateurs = isIndicateurAlreadyLinked
      ? currentIndicateurs.filter((i) => i.id !== indicateur.id)
      : [...currentIndicateurs, indicateur];

    return updateFiche({
      ficheId: fiche.id,
      ficheFields: {
        indicateurs: updatedIndicateurs,
      },
    });
  };

  const canCreateIndicateur = hasPermission(
    collectivite.permissions,
    'indicateurs.indicateurs.create'
  );
  const canUpdateIndicateur = (indicateur: IndicateurDefinitionListItem) =>
    canUpdateIndicateurDefinition(
      collectivite.permissions,
      indicateur,
      user.id
    );

  const [indicateurAction, setIndicateurAction] =
    useState<IndicateurActionMode>('none');

  const toggleIndicateurAction = (action: IndicateurActionMode) => {
    setIndicateurAction(action === indicateurAction ? 'none' : action);
  };

  const indicateurs: IndicateursState = {
    list: indicateursList,
    isLoading: isLoadingIndicateurs,
    update: updateIndicateurs,
    canUpdate: canUpdateIndicateur,
    canCreate: canCreateIndicateur,
    action: indicateurAction,
    toggleAction: toggleIndicateurAction,
  };

  const notes: NotesState = {
    list: fiche.notes ?? [],
    upsert: async (noteToUpsert) => {
      const formattedDateNote = `${noteToUpsert.dateNote}-01-01`;
      const formattedNoteToUpsert = {
        ...noteToUpsert,
        dateNote: formattedDateNote,
      };

      const notes =
        noteToUpsert.id === undefined
          ? [...(fiche.notes ?? []), formattedNoteToUpsert]
          : fiche.notes?.map((note) =>
              note.id === noteToUpsert.id ? formattedNoteToUpsert : note
            );

      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          notes,
        },
      });
    },
    delete: async (noteId: number) => {
      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          notes: fiche.notes?.filter((note) => note.id !== noteId),
        },
      });
    },
  };

  return (
    <FicheContext.Provider
      value={{
        fiche,
        isReadonly,
        planId,
        update: updateFiche,
        isUpdating: isUpdatePending,
        fichesLiees,
        documents,
        indicateurs,
        notes,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};
