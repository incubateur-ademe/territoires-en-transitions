import { toSousIndicateursCapabilities } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-capabilities.rules';
import { Divider } from '@tet/ui';
import { IndicateurCommentaireInput } from '../../content/donnees/indicateur-commentaire.input';
import { IndicateurDonneesCard } from '../../content/donnees/indicateur-donnees.card';
import { IndicateurSousIndicateursChart } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.view';
import { IndicateurSousIndicateursTable } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-table.view';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurNouveauSousIndicateur } from '../../context/indicateur-nouveau-sous-indicateur.context';

export const IndicateurPredefiniComposeDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { updateCommentaire, updateIndicateur } = useIndicateurActions();
  const newSousIndicateur = useIndicateurNouveauSousIndicateur();
  const capabilities = toSousIndicateursCapabilities(indicateur);
  const { commentaire, unite, periodicite } = indicateur;

  return (
    <IndicateurDonneesCard>
      <div className="mb-6">
        <IndicateurSousIndicateursChart
          indicateurId={indicateur.id}
          isCumul={capabilities.cumul === 'enabled'}
          unite={unite}
          periodicite={periodicite}
        />
      </div>

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        <IndicateurSousIndicateursTable
          indicateurId={indicateur.id}
          titre={indicateur.titre}
          unite={unite}
          periodicite={periodicite}
          isReadonly={!canMutateValeur}
          canMutateIndicateur={canMutateIndicateur}
          capabilities={capabilities}
          newSousIndicateur={newSousIndicateur}
          privateMode={{
            isConfidentiel: indicateur.estConfidentiel ?? false,
            onChange: (estConfidentiel) =>
              updateIndicateur({ estConfidentiel }),
          }}
        />

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
