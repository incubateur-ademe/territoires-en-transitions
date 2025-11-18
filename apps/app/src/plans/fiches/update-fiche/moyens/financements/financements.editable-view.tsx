import { FicheWithRelations } from '@/domain/plans';
import { RichTextView } from '../../components/RichTextView';
import { EditableSection } from '../components/EditableSection';

type FinancementsEditableViewProps = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  onEdit: () => void;
};

export const FinancementsEditableView = ({
  fiche,
  isReadonly = true,
  onEdit,
}: FinancementsEditableViewProps) => {
  const financements = fiche.financements;
  const hasContent = !!financements && financements.length > 0;

  return (
    <EditableSection
      label="Financements :"
      isReadonly={isReadonly}
      hasContent={hasContent}
      onEdit={onEdit}
      editButtonTitle="Modifier les financements"
    >
      <RichTextView content={financements} textColor="grey" />
    </EditableSection>
  );
};
