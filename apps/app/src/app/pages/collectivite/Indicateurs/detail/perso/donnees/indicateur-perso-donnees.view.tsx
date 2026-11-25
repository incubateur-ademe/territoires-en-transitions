import { Divider } from '@tet/ui';
import { useState } from 'react';
import IndicateurDetailChart from '../../../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../../../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from '../../content/donnees/indicateur-commentaire.input';
import { IndicateurDonneesCard } from '../../content/donnees/indicateur-donnees.card';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurNouveauSousIndicateur } from '../../context/indicateur-nouveau-sous-indicateur.context';
import { CreateSousIndicateurButton } from '../../content/sous-indicateurs/create-sous-indicateur.button';
import { IndicateurSousIndicateursChart } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.view';
import { IndicateurSousIndicateursTable } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-table.view';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './thematiques-indicateur.input';

export const IndicateurPersoDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { updateUnite, updateCommentaire, updateIndicateur } =
    useIndicateurActions();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const newSousIndicateur = useIndicateurNouveauSousIndicateur();
  const { commentaire, unite } = indicateur;

  const hasSousIndicateurs = indicateur.enfants.length > 0;
  const isValeursReadonly =
    !canMutateValeur || indicateur.sansValeurUtilisateur;

  return (
    <IndicateurDonneesCard>
      <div className="flex flex-row gap-4">
        <IndicateurUniteInput
          titre={indicateur.titre}
          unite={unite}
          hasSousIndicateurs={hasSousIndicateurs}
          updateUnite={updateUnite}
          disabled={!canMutateIndicateur}
          parentTitre={indicateur.ancestors.at(-1)?.titre}
        />
      </div>

      {hasSousIndicateurs ? (
        <div className="mb-6">
          <IndicateurSousIndicateursChart
            indicateurId={indicateur.id}
            isCumul={indicateur.totalEstCumulDesSousIndicateurs}
            unite={unite}
            periodicite={indicateur.periodicite}
          />
        </div>
      ) : (
        <IndicateurDetailChart
          className="mb-6"
          chartInfo={chartInfo}
          indicateur={indicateur}
          isReadonly={isValeursReadonly}
          onAddValue={() => setIsTableModalOpen(true)}
        />
      )}

      <div className="flex flex-col gap-7">
        <Divider color="primary" className="mb-6" />

        {hasSousIndicateurs ? (
          <IndicateurSousIndicateursTable
            indicateurId={indicateur.id}
            titre={indicateur.titre}
            unite={unite}
            periodicite={indicateur.periodicite}
            isReadonly={isValeursReadonly}
            canMutateIndicateur={canMutateIndicateur}
            isCumul={indicateur.totalEstCumulDesSousIndicateurs}
            newSousIndicateur={newSousIndicateur}
            privateMode={{
              isConfidentiel: indicateur.estConfidentiel ?? false,
              onChange: (estConfidentiel) =>
                updateIndicateur({ estConfidentiel }),
            }}
          />
        ) : (
          <IndicateurValuesTabs
            isReadonly={isValeursReadonly}
            openModalState={{
              isOpen: isTableModalOpen,
              setIsOpen: setIsTableModalOpen,
            }}
            actions={
              canMutateIndicateur ? (
                <CreateSousIndicateurButton
                  parentId={indicateur.id}
                  childCount={0}
                  onCreated={newSousIndicateur.onCreated}
                />
              ) : undefined
            }
          />
        )}

        <Divider color="primary" className="my-6" />
      </div>

      <ThematiquesIndicateurInput disabled={!canMutateIndicateur} />

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateIndicateur}
        updateCommentaire={updateCommentaire}
      />
    </IndicateurDonneesCard>
  );
};
