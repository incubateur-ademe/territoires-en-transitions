import { Checkbox, FormSection } from '@/ui';

type FicheRestreintEditorFormSectionProps = {
  restreint: boolean;
  onChange: (restreint: boolean) => void;
  className?: string;
};

export const FicheRestreintEditorFormSection = ({
  restreint,
  onChange,
  className,
}: FicheRestreintEditorFormSectionProps) => {
  return (
    <FormSection title="Accès général" className={className}>
      <Checkbox
        data-test="FicheToggleConfidentialite"
        variant="switch"
        label="Fiche action en mode privé"
        message="Si le mode privé est activé, la fiche action n'est plus consultable par les personnes n'étant pas membres de votre collectivité. La fiche reste consultable par l'ADEME, le service support de la plateforme et les autres collectivités avec qui vous avez partagé la fiche en édition."
        containerClassname="col-span-2"
        checked={restreint}
        onChange={() => onChange(!restreint)}
      />
    </FormSection>
  );
};
