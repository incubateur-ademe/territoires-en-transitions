import { MultipleCollectiviteSelector } from '@/app/plans/fiches/share-fiche/multiple-collectivite.selector';
import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { IdNameSchema } from '@tet/domain/shared';
import { Field, FormSection } from '@tet/ui';

type FicheShareEditorFormSectionProps = {
  collectivites: IdNameSchema[];
  onChange: (collectivites: IdNameSchema[]) => void;
};

export const FicheShareEditorFormSection = ({
  collectivites,
  onChange,
}: FicheShareEditorFormSectionProps) => {
  const shareFicheFlagEnabled = useShareFicheEnabled();

  if (!shareFicheFlagEnabled) {
    return null;
  }

  return (
    <FormSection
      title="Collectivités avec accès"
      smallRootGap
      className="!grid-cols-1"
    >
      <Field
        title="Collectivités pouvant éditer cette action :"
        state="info"
        message="Les administrateurs et éditeurs de cette collectivité pourront éditer cette action"
      >
        <MultipleCollectiviteSelector
          collectivites={collectivites}
          onChange={onChange}
        />
      </Field>
    </FormSection>
  );
};
