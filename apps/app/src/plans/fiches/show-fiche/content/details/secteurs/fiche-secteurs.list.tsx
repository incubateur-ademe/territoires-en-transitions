import { appLabels } from '@/app/labels/catalog';
import { FicheSecteurs } from '@tet/domain/plans';
import { Badge } from '@tet/ui';

const etatLabels = {
  non_attribuable: appLabels.ficheSecteursNonAttribuable,
  en_cours_de_calcul: appLabels.ficheSecteursEnCoursDeCalcul,
  a_renseigner: appLabels.ficheSecteursARenseigner,
  non_renseigne: appLabels.ficheSecteursNonRenseigne,
} satisfies Record<Exclude<FicheSecteurs['etat'], 'attribue'>, string>;

const EtatMessage = ({ children }: { children: string }) => (
  <span className="text-sm text-grey-7">{children}</span>
);

export const FicheSecteursList = ({
  isLoading,
  secteurs,
}: {
  isLoading: boolean;
  secteurs: FicheSecteurs | undefined;
}) => {
  if (isLoading) {
    return <EtatMessage>{appLabels.ficheSecteursChargement}</EtatMessage>;
  }
  if (!secteurs) {
    return null;
  }
  if (secteurs.etat !== 'attribue') {
    return <EtatMessage>{etatLabels[secteurs.etat]}</EtatMessage>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {secteurs.secteurs.map((secteur) => (
        <li key={secteur}>
          <Badge
            title={appLabels.ficheSecteurReglementaireLabels[secteur]}
            variant="info"
            type="outlined"
            size="sm"
          />
        </li>
      ))}
    </ul>
  );
};
