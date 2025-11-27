import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelations } from '@/domain/plans';
import { PermissionOperation } from '@/domain/users';
import { createContext, ReactNode, useContext } from 'react';

type FicheContextValue = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  planId?: number;
  permissions: PermissionOperation[];
  collectiviteId: number;
  updateFiche: ReturnType<typeof useUpdateFiche>['mutate'];
  isEditLoading: boolean;
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
  const { collectiviteId, permissions } = collectivite;
  const user = useUser();
  const { mutate: updateFiche, isPending: isEditLoading } = useUpdateFiche();

  const isReadonly =
    collectivite.isReadOnly ||
    !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id);

  return (
    <FicheContext.Provider
      value={{
        fiche,
        isReadonly,
        planId,
        permissions,
        collectiviteId,
        updateFiche,
        isEditLoading,
      }}
    >
      {children}
    </FicheContext.Provider>
  );
};
