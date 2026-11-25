import { Divider } from '@tet/ui';
import { IndicateurCommentaireInput } from '../../content/donnees/indicateur-commentaire.input';
import { IndicateurDonneesCard } from '../../content/donnees/indicateur-donnees.card';
import { IndicateurDonneesSelects } from '../../content/donnees/indicateur-donnees-selects.view';
import { IndicateurPersonnalisationSection } from '../../content/donnees/indicateur-personnalisation.view';
import { IndicateurSousIndicateursChart } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.view';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { IndicateurPredefiniAvecEnfantsTable } from './indicateur-predefini-avec-enfants.table';

export const IndicateurPredefiniAvecEnfantsDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { updateCommentaire } = useIndicateurActions();
  const { commentaire, unite, periodicite } = indicateur;

  return (
    <IndicateurDonneesCard>
      <div className="flex flex-row gap-4">
        <IndicateurDonneesSelects />
      </div>

      <IndicateurPersonnalisationSection />

      <div className="mb-6">
        <IndicateurSousIndicateursChart
          indicateurId={indicateur.id}
          unite={unite}
          periodicite={periodicite}
        />
      </div>

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        <IndicateurPredefiniAvecEnfantsTable isReadonly={!canMutateValeur} />

        <Divider color="primary" className="my-6" />
      </div>

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateIndicateur}
        updateCommentaire={updateCommentaire}
      />
    </IndicateurDonneesCard>
  );
};
