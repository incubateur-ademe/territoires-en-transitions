import { Alert, Button } from '@/ui';

interface DonneesPartiellementDisponibles {
  title?: string;
  description?: string;
  disabled?: boolean;
  onOpenModal?: () => void;
}

const DEFAULT_TITLE =
  'Voici un premier calcul de votre trajectoire SNBC territorialisée, avec les données disponibles !';
const DEFAULT_DESC =
  "Il manque des données pour certains secteurs : complétez les données manquantes pour l'année 2015 afin de finaliser le calcul.";

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
          Compléter les données
        </Button>
      }
    />
  );
};
