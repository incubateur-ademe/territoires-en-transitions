import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { ListActionsResponse } from '@/app/referentiels/actions/use-list-actions';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import { FicheNote, FicheNoteUpsert, Financeur } from '@tet/domain/plans';
import z from 'zod';

export type ActionsLieesState = {
  list: FicheListItem[];
  isLoading: boolean;
  update: (linkedFicheIds: number[]) => void;
  updateActionLiee: (fiche: FicheListItem) => void;
};

export type DocumentsState = {
  list: TPreuve[] | undefined;
  isLoading: boolean;
};

export type IndicateursState = {
  list: IndicateurDefinitionListItem[];
  isLoading: boolean;
  update: (indicateur: IndicateurDefinitionListItem) => Promise<void>;
  canUpdate: (indicateur: IndicateurDefinitionListItem) => boolean;
  canCreate: boolean;
};

export type NotesState = {
  list: FicheNote[];
  upsert: (
    noteToUpsert: Omit<FicheNoteUpsert, 'dateNote'> & { dateNote: number }
  ) => Promise<void>;
  delete: (noteToDeleteId: number) => Promise<void>;
};

export type BudgetsState = {
  investissement: { perYear: BudgetPerYear[]; summary: Budget | null };
  fonctionnement: { perYear: BudgetPerYear[]; summary: Budget | null };
  isLoading: boolean;
  upsert: {
    year: (
      budget: BudgetPerYear,
      type: 'investissement' | 'fonctionnement'
    ) => Promise<void>;
    summary: (
      summary: Budget,
      type: 'investissement' | 'fonctionnement'
    ) => Promise<void>;
  };
  deleteBudgets: (
    year: number,
    type: 'investissement' | 'fonctionnement'
  ) => Promise<void>;
  reset: (
    type: 'investissement' | 'fonctionnement',
    view: 'year' | 'summary'
  ) => Promise<void>;
};

export type FinanceursState = {
  list: Financeur[];
  upsert: (data: {
    financeurTagId: number;
    montantTtc: number;
  }) => Promise<void>;
  delete: (financeurTagId: number) => Promise<void>;
  getFinanceurName: (financeurTagId: number) => string | undefined;
};

export type MesuresState = {
  list: ListActionsResponse['data'];
  linkMesure: (mesureId: string) => Promise<void>;
  unlinkMesure: (mesureId: string) => Promise<void>;
};

export const budgetSummarychema = z.object({
  montant: z.number().optional(),
  depense: z.number().optional(),
  etpPrevisionnel: z.number().optional(),
  etpReel: z.number().optional(),
  htBudgetId: z.number().optional(),
  etpBudgetId: z.number().optional(),
});

export type Budget = z.infer<typeof budgetSummarychema>;

export const budgetPerYearFormSchema = budgetSummarychema.extend({
  year: z.number(),
});
export type BudgetPerYear = z.infer<typeof budgetPerYearFormSchema>;
