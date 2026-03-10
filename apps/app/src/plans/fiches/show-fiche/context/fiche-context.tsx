import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { FicheWithRelations } from '@tet/domain/plans';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useUpdateFiche } from '../../update-fiche/data/use-update-fiche';
import { useFicheActionsLiees } from './hooks/use-fiche-actions-liees';
import { useFicheBudgets } from './hooks/use-fiche-budgets';
import { useFicheDocuments } from './hooks/use-fiche-documents';
import { useFicheFinanceurs } from './hooks/use-fiche-financeurs';
import { useFicheIndicateurs } from './hooks/use-fiche-indicateurs';
import { useFicheNotes } from './hooks/use-fiche-notes';
import {
  ActionsLieesState,
  BudgetsState,
  DocumentsState,
  FinanceursState,
  IndicateursState,
  NotesState,
} from './types';

export type FicheContextValue = {
  fiche: FicheWithRelations;
  isReadonly: boolean;
  planId?: number;
  update: ReturnType<typeof useUpdateFiche>['mutate'];
  isUpdating: boolean;
  actionsLiees: ActionsLieesState;
  documents: DocumentsState;
  indicateurs: IndicateursState;
  notes: NotesState;
  budgets: BudgetsState;
  financeurs: FinanceursState;
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

  const isReadonly = useMemo(
    () =>
      !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id) ||
      isFicheSharedWithCollectivite(fiche, collectivite.collectiviteId),
    [collectivite, fiche, user.id]
  );

  const documents = useFicheDocuments(collectivite.collectiviteId, fiche.id);
  const actionsLiees = useFicheActionsLiees(
    collectivite.collectiviteId,
    fiche.id
  );
  const indicateurs = useFicheIndicateurs(collectivite, fiche.id, user.id);
  const notes = useFicheNotes(fiche);
  const budgets = useFicheBudgets(fiche);
  const financeurs = useFicheFinanceurs(fiche);

  const contextValue: FicheContextValue = useMemo(
    () => ({
      fiche,
      isReadonly,
      planId,
      update: updateFiche,
      isUpdating: isUpdatePending,
      actionsLiees,
      documents,
      indicateurs,
      notes,
      budgets,
      financeurs,
    }),
    [
      fiche,
      isReadonly,
      planId,
      updateFiche,
      isUpdatePending,
      actionsLiees,
      documents,
      indicateurs,
      notes,
      budgets,
      financeurs,
    ]
  );

  return (
    <FicheContext.Provider value={contextValue}>
      {children}
    </FicheContext.Provider>
  );
};
