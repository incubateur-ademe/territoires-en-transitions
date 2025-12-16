import { FicheWithRelations } from '@tet/domain/plans';
import { BudgetTagsList } from '../budget/budget-tags.list';
import { EditableSection } from '../components/EditableSection';

type FinanceursEditableViewProps = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  onEdit: () => void;
};

export const FinanceursEditableView = ({
  fiche,
  isReadonly = true,
  onEdit,
}: FinanceursEditableViewProps) => {
  const financeurs = fiche.financeurs;
  const hasContent = !!financeurs && financeurs.length > 0;

  return (
    <EditableSection
      label="Financeurs :"
      isReadonly={isReadonly}
      hasContent={hasContent}
      onEdit={onEdit}
      editButtonTitle="Modifier les financeurs"
    >
      {financeurs && (
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <BudgetTagsList
            tags={financeurs.map((f) => ({
              name: f.financeurTag.nom,
              amount: f.montantTtc,
            }))}
          />
        </div>
      )}
    </EditableSection>
  );
};
