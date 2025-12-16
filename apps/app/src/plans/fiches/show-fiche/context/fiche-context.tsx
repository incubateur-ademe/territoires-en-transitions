import { canUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/indicateur-definition-authorization.utils';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import {
  IndicateurDefinitionListItem,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { FicheWithRelations } from '@tet/domain/plans';
import { createContext, ReactNode, useContext, useState } from 'react';
import {
  UpdateFiche,
  useUpdateFiche,
} from '../../update-fiche/data/use-update-fiche';

type IndicateurActionMode = 'creating' | 'associating' | 'none';

export type FicheContextValue = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  planId?: number;
  updateFiche: UpdateFiche;
  isUpdatePending: boolean;
  selectedIndicateurs: IndicateurDefinitionListItem[];
  updateIndicateurs: (
    indicateur: IndicateurDefinitionListItem
  ) => Promise<void>;
  isLoadingIndicateurs: boolean;
  canUpdateIndicateur: (indicateur: IndicateurDefinition) => boolean;
  canCreateIndicateur: boolean;
  indicateurAction: IndicateurActionMode;
  toggleIndicateurAction: (action: IndicateurActionMode) => void;
  isFicheShared: boolean;
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
  const { mutate: updateFiche, isPending: isUpdatePending } = useUpdateFiche();

  const isFicheShared = isFicheSharedWithCollectivite(
    fiche,
    collectivite.collectiviteId
  );
  const isReadonly =
    collectivite.isReadOnly ||
    !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id) ||
    isFicheShared === true;

  const {
    data: { data: selectedIndicateurs = [] } = {},
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
    const currentIndicateurs = selectedIndicateurs ?? [];
    const isIndicateurAlreadyLinked =
      currentIndicateurs.some((i) => i.id === indicateur.id) ?? false;

    const updatedIndicateurs = isIndicateurAlreadyLinked
      ? currentIndicateurs.filter((i) => i.id !== indicateur.id)
      : [...currentIndicateurs, indicateur];

    return await updateFiche({
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
        isFicheShared,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};
