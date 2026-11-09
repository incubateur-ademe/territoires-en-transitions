import { appLabels } from '@/app/labels/catalog';
import {
  isDemarchePcaetEnCours,
  type DemarchePcaetCouvrante,
} from '@tet/domain/demarches';
import { Alert } from '@tet/ui';

/** Tant qu'un dépôt de Supra qui couvre la collectivité est en cours. */
export const PorteParSupraAlert = ({
  couvrantes,
}: {
  couvrantes: DemarchePcaetCouvrante[] | undefined;
}) => {
  const enCours = couvrantes?.find(({ status }) =>
    isDemarchePcaetEnCours(status)
  );
  if (!enCours) {
    return null;
  }
  return (
    <Alert
      state="info"
      title={appLabels.demarcheListePorteeParSupra({
        porteur: enCours.porteur.nom,
      })}
    />
  );
};
