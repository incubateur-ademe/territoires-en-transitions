import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { FicheWithRelations } from '@tet/domain/plans';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useUpdateFiche } from '../../update-fiche/data/use-update-fiche';

type IndicateurActionMode = 'creating' | 'associating' | 'none';

export type FicheContextValue = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  planId?: number;
  updateFiche: ReturnType<typeof useUpdateFiche>['mutate'];
  isUpdatePending: boolean;
  selectedIndicateurs: IndicateurDefinitionListItem[];
  updateIndicateurs: (
    indicateur: IndicateurDefinitionListItem
  ) => Promise<void>;
  isLoadingIndicateurs: boolean;
  canUpdateIndicateur: (indicateur: IndicateurDefinitionListItem) => boolean;
  canCreateIndicateur: boolean;
  indicateurAction: IndicateurActionMode;
  toggleIndicateurAction: (action: IndicateurActionMode) => void;
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

  const {
    data: { data: selectedIndicateurs = [] } = {},
    isLoading: isLoadingIndicateurs,
  } = useListIndicateurs({
    collectiviteId: fiche.collectiviteId,
    filters: {
      ficheIds: [fiche.id],
    },
  });

  const updateIndicateurs = async (
    indicateur: IndicateurDefinitionListItem
  ) => {
    const currentIndicateurs = selectedIndicateurs ?? [];
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
    'indicateurs.indicateurs.create'
  );
  const canUpdateIndicateur = (indicateur: IndicateurDefinitionListItem) =>
    canUpdateIndicateurDefinition(
      collectivite.permissions,
      indicateur,
      user.id
    );

  const [indicateurAction, setIndicateurAction] = useState<
    'creating' | 'associating' | 'none'
  >('none');

  const toggleIndicateurAction = (action: IndicateurActionMode) => {
    setIndicateurAction(action === indicateurAction ? 'none' : action);
  };

  return (
    <FicheContext.Provider
      value={{
        fiche,
        isReadonly,
        planId,
        updateFiche,
        isUpdatePending,
        selectedIndicateurs,
        updateIndicateurs,
        isLoadingIndicateurs,
        canCreateIndicateur,
        canUpdateIndicateur,
        indicateurAction,
        toggleIndicateurAction,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};
