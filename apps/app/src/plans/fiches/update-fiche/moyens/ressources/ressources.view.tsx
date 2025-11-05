import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@/domain/plans';
import { RichTextView } from '../../components/RichTextView';
import { EditableSection } from '../components/EditableSection';

type MoyensProps = {
  fiche: Pick<FicheWithRelations, 'ressources'> & FicheShareProperties;
  isReadonly?: boolean;
  onEdit?: () => void;
};

export const Moyens = ({ fiche, isReadonly = true, onEdit }: MoyensProps) => {
  const ressources = fiche.ressources;
  const hasContent = !!ressources && ressources.trim().length > 0;
  return (
    <EditableSection
      label="Moyens humains et techniques :"
      isReadonly={isReadonly}
      hasContent={hasContent}
      onEdit={onEdit}
      editButtonTitle="Modifier les moyens"
    >
      <div className="mb-0 text-sm leading-6">
        <RichTextView content={ressources} textColor="grey" />
      </div>
    </EditableSection>
  );
};
