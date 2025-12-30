import { canUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/indicateur-definition-authorization.utils';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import {
  IndicateurDefinitionListItem,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
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
import { FicheWithRelations } from '@tet/domain/plans';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useUpdateFiche } from '../../update-fiche/data/use-update-fiche';
import { useAnnexesFicheAction } from '../data/useAnnexesFicheAction';
import { useUpdateFichesActionLiees } from '../data/useFichesActionLiees';

type IndicateurActionMode = 'creating' | 'associating' | 'none';

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
  canUpdate: (indicateur: IndicateurDefinition) => boolean;
  canCreate: boolean;
  action: IndicateurActionMode;
  toggleAction: (action: IndicateurActionMode) => void;
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
  const { mutateAsync: updateFiche, isPending: isUpdating } = useUpdateFiche();

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

  const {
    data: { data: indicateursList = [] } = {},
    isLoading: isLoadingIndicateurs,
  } = useListIndicateurDefinitions(
    {
      filters: {
        ficheIds: [fiche.id],
      },
    },
    {
      doNotAddCollectiviteId: true,
    }
  );

  const updateIndicateurs = async (
    indicateur: IndicateurDefinitionListItem
  ) => {
    const currentIndicateurs = indicateursList ?? [];
    const isIndicateurAlreadyLinked =
      currentIndicateurs.some((i) => i.id === indicateur.id) ?? false;

    const updatedIndicateurs = isIndicateurAlreadyLinked
      ? currentIndicateurs.filter((i) => i.id !== indicateur.id)
      : [...currentIndicateurs, indicateur];

    await updateFiche({
      ficheId: fiche.id,
      ficheFields: {
        indicateurs: updatedIndicateurs,
      },
    });
  };

  const canCreateIndicateur = hasPermission(
    collectivite.permissions,
    'indicateurs.definitions.create'
  );

  const canUpdateIndicateur = (indicateur: IndicateurDefinition) =>
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

  return (
    <FicheContext.Provider
      value={{
        fiche,
        isReadonly,
        planId,
        update: updateFiche,
        isUpdating,
        fichesLiees,
        documents,
        indicateurs,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};
