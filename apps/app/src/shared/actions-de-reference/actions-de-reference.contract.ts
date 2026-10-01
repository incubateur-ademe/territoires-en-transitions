import type {
  ActionDeReference,
  CategorieAction,
  LevierId,
  ListActionsDeReferenceInput,
  UpdateActionDeReferenceInput,
} from '@tet/domain/shared';
import type { JSX } from 'react';

export type ActionDeReferenceSortField = ListActionsDeReferenceInput['sortBy'];

export type ActionsDeReferenceSearch = {
  readonly searchedText: string;
  readonly leviers: readonly LevierId[];
  readonly categories: readonly CategorieAction[];
  readonly sortBy: ActionDeReferenceSortField;
};

export type CleanSearchParams = (
  searchParams: URLSearchParams
) => URLSearchParams;

export type ActionsDeReferenceSearchParams = {
  readonly search: ActionsDeReferenceSearch;
  readonly changeSearch: (changes: Partial<ActionsDeReferenceSearch>) => void;
  readonly resetSearch: () => void;
};

export type UseActionsDeReferenceSearchParams =
  () => ActionsDeReferenceSearchParams;

export type ActionsDeReferenceList =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly retry: () => void }
  | {
      readonly status: 'loaded';
      readonly actions: readonly ActionDeReference[];
    };

export type UseListActionsDeReference = (
  search: ActionsDeReferenceSearch
) => ActionsDeReferenceList;

export type UpdateActionDeReferenceOutcome = 'updated' | 'rejected';

export type ActionDeReferenceUpdate = {
  readonly updateAction: (
    input: UpdateActionDeReferenceInput
  ) => Promise<UpdateActionDeReferenceOutcome>;
  readonly isPending: boolean;
};

export type UseUpdateActionDeReference = () => ActionDeReferenceUpdate;

export type ActionDeReferenceUpdateAccess =
  | { readonly status: 'forbidden' }
  | {
      readonly status: 'allowed';
      readonly onUpdate: (action: ActionDeReference) => void;
    };

export type ActionsDeReferenceViewComponent = () => JSX.Element;

export type ActionsDeReferenceFiltersProps = {
  readonly search: ActionsDeReferenceSearch;
  readonly onSearchChange: (changes: Partial<ActionsDeReferenceSearch>) => void;
};

export type ActionsDeReferenceFiltersComponent = (
  props: ActionsDeReferenceFiltersProps
) => JSX.Element;

export type ActionsDeReferenceResultsProps = {
  readonly list: ActionsDeReferenceList;
  readonly updateAccess: ActionDeReferenceUpdateAccess;
  readonly onResetSearch: () => void;
};

export type ActionsDeReferenceResultsComponent = (
  props: ActionsDeReferenceResultsProps
) => JSX.Element;

export type ActionDeReferenceCardProps = {
  readonly action: ActionDeReference;
  readonly updateAccess: ActionDeReferenceUpdateAccess;
};

export type ActionDeReferenceCardComponent = (
  props: ActionDeReferenceCardProps
) => JSX.Element;

export type UpdateActionDeReferenceSidePanel = {
  readonly open: (action: ActionDeReference) => void;
};

export type UseUpdateActionDeReferenceSidePanel =
  () => UpdateActionDeReferenceSidePanel;

export type UpdateActionDeReferenceFormProps = {
  readonly action: ActionDeReference;
  readonly onUpdated: () => void;
};

export type UpdateActionDeReferenceFormComponent = (
  props: UpdateActionDeReferenceFormProps
) => JSX.Element;

export type DiscardChangesConfirmModalProps = {
  readonly isOpen: boolean;
  readonly onDiscard: () => void;
  readonly onKeepEditing: () => void;
};

export type DiscardChangesConfirmModalComponent = (
  props: DiscardChangesConfirmModalProps
) => JSX.Element;
