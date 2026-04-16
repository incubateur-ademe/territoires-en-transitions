import { appLabels } from '@/app/labels/catalog';
import { Alert, Button } from '@tet/ui';

interface DonneesPartiellementDisponibles {
  title?: string;
  description?: string;
  disabled?: boolean;
  onOpenModal?: () => void;
}

const DEFAULT_TITLE =
  appLabels.trajectoireDonneesPartiellesTitle;
const DEFAULT_DESC =
  appLabels.trajectoireDonneesPartiellesDescription;

/** Affiche l'avertissement "Données partiellement disponibles" */
export const DonneesPartiellementDisponibles = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  disabled = false,
  onOpenModal,
}: DonneesPartiellementDisponibles) => {
  return (
    <Alert
      state="warning"
      title={title}
      description={description}
      footer={
        <Button disabled={disabled} size="sm" onClick={onOpenModal}>
          {appLabels.trajectoireCompleterDonneesLabel}
        </Button>
      }
    />
  );
};
