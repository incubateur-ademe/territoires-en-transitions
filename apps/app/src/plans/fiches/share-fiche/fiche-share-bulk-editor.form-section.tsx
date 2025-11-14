import { MultipleCollectiviteSelector } from '@/app/plans/fiches/share-fiche/multiple-collectivite.selector';
import { IdNameSchema } from '@/domain/shared';
import { Field, FormSection } from '@/ui';
import classNames from 'classnames';

type FicheShareBulkEditorFormSectionProps = {
  collectivitesToAdd: IdNameSchema[];
  collectivitesToRemove: IdNameSchema[];
  onCollectivitesToAddChange: (collectivites: IdNameSchema[]) => void;
  onCollectivitesToRemoveChange: (collectivites: IdNameSchema[]) => void;
  className?: string;
};

export const FicheShareBulkEditorFormSection = ({
  collectivitesToAdd,
  onCollectivitesToAddChange,
  collectivitesToRemove,
  onCollectivitesToRemoveChange,
  className,
}: FicheShareBulkEditorFormSectionProps) => {
  return (
    <FormSection
      title="Collectivités avec accès"
      smallRootGap
      className={classNames('!grid-cols-1', className)}
    >
      <Field
        title="Donner l'accès aux collectivités suivantes :"
        state="info"
        message="Les administrateurs et éditeurs de cette collectivité pourront éditer ces fiches"
      >
        <MultipleCollectiviteSelector
          collectivites={collectivitesToAdd}
          onChange={onCollectivitesToAddChange}
        />
      </Field>
      <Field
        title="Retirer l'accès aux collectivités suivantes :"
        state="info"
        message="Les administrateurs et éditeurs de ces collectivité ne pourront plus éditer ces fiches"
      >
        <MultipleCollectiviteSelector
          collectivites={collectivitesToRemove}
          onChange={onCollectivitesToRemoveChange}
        />
      </Field>
    </FormSection>
  );
};
