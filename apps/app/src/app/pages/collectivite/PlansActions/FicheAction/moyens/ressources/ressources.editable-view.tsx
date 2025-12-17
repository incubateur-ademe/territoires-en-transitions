import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@tet/domain/plans';
import { RichTextView } from '../../components/RichTextView';
import { EditableSection } from '../components/EditableSection';

type RessourcesEditableViewProps = {
  fiche: Pick<FicheWithRelations, 'ressources'> & FicheShareProperties;
  isReadonly?: boolean;
  onEdit?: () => void;
};

export const RessourcesEditableView = ({
  fiche,
  isReadonly = true,
  onEdit,
}: RessourcesEditableViewProps) => {
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
      <RichTextView content={ressources} textColor="grey" />
    </EditableSection>
  );
};
