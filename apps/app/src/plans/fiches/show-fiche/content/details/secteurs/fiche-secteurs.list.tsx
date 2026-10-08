import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { FicheSecteurs } from '@tet/domain/plans';

const etatLabels = {
  non_attribuable: appLabels.ficheSecteursNonAttribuable,
  en_cours_de_calcul: appLabels.ficheSecteursEnCoursDeCalcul,
  a_renseigner: appLabels.ficheSecteursARenseigner,
  non_renseigne: appLabels.ficheSecteursNonRenseigne,
} satisfies Record<Exclude<FicheSecteurs['etat'], 'attribue'>, string>;

export const isARenseigner = (secteurs: FicheSecteurs) =>
  secteurs.etat === 'non_attribuable' && secteurs.origine === 'automatique';

export const FicheSecteursList = ({
  isLoading,
  secteurs,
}: {
  isLoading: boolean;
  secteurs: FicheSecteurs | undefined;
}) => {
  if (isLoading) {
    return (
      <span role="status" className="flex items-center h-6">
        <SpinnerLoader className="w-4 h-4" />
        <span className="sr-only">{appLabels.ficheSecteursChargement}</span>
      </span>
    );
  }
  if (!secteurs) {
    return null;
  }

  return (
    <span>
      {secteurs.etat === 'attribue'
        ? secteurs.secteurs
            .map(
              (secteur) => appLabels.ficheSecteurReglementaireLabels[secteur]
            )
            .join(', ')
        : isARenseigner(secteurs)
          ? appLabels.ficheSecteursARenseigner
          : etatLabels[secteurs.etat]}
    </span>
  );
};
