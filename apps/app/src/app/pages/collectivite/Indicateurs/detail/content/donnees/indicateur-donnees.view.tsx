import { toSousIndicateursCapabilities } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-capabilities.rules';
import { isIndicateurPerso } from '@tet/domain/indicateurs';
import { Divider } from '@tet/ui';
import { useState } from 'react';
import IndicateurDetailChart from '../../../Indicateur/detail/IndicateurDetailChart';
import { IndicateurValuesTabs } from '../../../Indicateur/detail/IndicateurValuesTabs';
import { IndicateurCommentaireInput } from './indicateur-commentaire.input';
import { IndicateurDonneesCard } from './indicateur-donnees.card';
import { useIndicateurActions } from '../../context/indicateur-actions.context';
import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurNouveauSousIndicateur } from '../../context/indicateur-nouveau-sous-indicateur.context';
import { CreateSousIndicateurButton } from '../sous-indicateurs/create-sous-indicateur.button';
import { IndicateurSousIndicateursChart } from '../sous-indicateurs/indicateur-sous-indicateurs-chart.view';
import { IndicateurSousIndicateursTable } from '../sous-indicateurs/indicateur-sous-indicateurs-table.view';
import { IndicateurDonneesSelects } from './indicateur-donnees-selects.view';
import { IndicateurPersonnalisationSection } from './indicateur-personnalisation.view';
import { IndicateurUniteInput } from './indicateur-unite.input';
import { ThematiquesIndicateurInput } from './thematiques-indicateur.input';

export const IndicateurDonnees = () => {
  const { indicateur, canMutateIndicateur, canMutateValeur } =
    useIndicateurData();
  const { chartInfo } = useIndicateurChart();
  const { updateUnite, updateCommentaire, updateIndicateur } =
    useIndicateurActions();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const newSousIndicateur = useIndicateurNouveauSousIndicateur();
  const { commentaire, unite } = indicateur;

  const isPerso = isIndicateurPerso(indicateur);
  const sousIndicateursCapabilities = toSousIndicateursCapabilities(indicateur);
  const hasSousIndicateurs = indicateur.enfants.length > 0;
  const isValeursReadonly =
    !canMutateValeur || indicateur.sansValeurUtilisateur;

  return (
    <IndicateurDonneesCard>
      <div className="flex flex-row gap-4">
        {isPerso && (
          <IndicateurUniteInput
            titre={indicateur.titre}
            unite={unite}
            hasSousIndicateurs={hasSousIndicateurs}
            updateUnite={updateUnite}
            disabled={!canMutateIndicateur}
            parentTitre={indicateur.ancestors.at(-1)?.titre}
          />
        )}
        <IndicateurDonneesSelects />
      </div>

      <IndicateurPersonnalisationSection />

      {hasSousIndicateurs ? (
        <div className="mb-6">
          <IndicateurSousIndicateursChart
            indicateurId={indicateur.id}
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
            capabilities={sousIndicateursCapabilities}
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
              canMutateIndicateur && isPerso ? (
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

      {isPerso && (
        <ThematiquesIndicateurInput disabled={!canMutateIndicateur} />
      )}

      <IndicateurCommentaireInput
        key={commentaire}
        commentaire={commentaire}
        disabled={!canMutateIndicateur}
        updateCommentaire={updateCommentaire}
      />
    </IndicateurDonneesCard>
  );
};
