import { Checkbox, FormSection } from '@tet/ui';

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
        label="Action en mode privé"
        message="Si le mode privé est activé, l'action n'est plus consultable par les personnes n'étant pas membres de votre collectivité. L'action reste consultable par l'ADEME, le service support de la plateforme et les autres collectivités avec qui vous avez partagé la action en édition."
        containerClassname="col-span-2"
        checked={restreint}
        onChange={() => onChange(!restreint)}
      />
    </FormSection>
  );
};
