import { FicheWithRelations } from '@/domain/plans';
import { EditableSection } from '../components/EditableSection';

type FinancementsProps = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
  onEdit: () => void;
};

export const Financements = ({
  fiche,
  isReadonly = true,
  onEdit,
}: FinancementsProps) => {
  const financements = fiche.financements;
  const hasContent = !!financements && financements.length > 0;

  return (
    <>
      <EditableSection
        label="Financements :"
        isReadonly={isReadonly}
        hasContent={hasContent}
        onEdit={onEdit}
        editButtonTitle="Modifier les financements"
      >
        <p className="mb-0 text-sm leading-6 whitespace-pre-wrap text-primary-10">
          {financements}
        </p>
      </EditableSection>
    </>
  );
};
