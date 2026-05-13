import { useUpsertIndicateurValeur } from '@/app/indicateurs/valeurs/use-upsert-indicateur-valeur';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  DATE_DEBUT_SNBC_V2_REFERENCE,
  IndicateurAvecValeursParSource,
} from '@tet/domain/indicateurs';
import { Alert, Button, Tab, Tabs } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { JSX } from 'react';
import { useComputeTrajectoire } from '../use-trajectoire';
import { Secteur, TableauDonnees } from './TableauDonnees';
import { tabsProperties } from './tabs-properties';
import { useDonneesSectorisees } from './useDonneesSectorisees';

export type DonneesCollectiviteProps = {
  onClose: () => void;
};

const toTableFormat = ({
  secteurs,
  indicateurs,
}: {
  secteurs: Secteur[];
  indicateurs: IndicateurAvecValeursParSource[];
}): {
  secteurId: string;
  indicateurId: number;
  valeurs: {
    source: string;
    valeur: number | null;
    id: number | undefined;
  }[];
}[] => {
  const secteurIds = secteurs.map((s) => s.identifiant);
  const valeursSecteurs = secteurIds
    ?.map((secteurId) => {
      const actualIndicateur = indicateurs?.find(
        (i) => i.definition.identifiantReferentiel === secteurId
      );

      if (!actualIndicateur) {
        console.error(
          `[Trajectoire SNBC] Secteur "${secteurId}" déclaré dans la configuration mais aucun indicateur correspondant trouvé : la cellule de saisie sera non-fonctionnelle. Vérifier la définition dans get-indicateur-trajectoire-for-value-input.ts.`
        );
        return null;
      }
      return {
        indicateurId: actualIndicateur.definition.id,
        secteurId,
        valeurs: Object.entries(actualIndicateur.sources).map(
          ([source, { valeurs }]) => ({
            source,
            valeur: valeurs?.[0].resultat ?? valeurs?.[0].objectif ?? null,
            id: valeurs?.[0].id,
          })
        ),
      };
    })
    ?.filter((v) => !!v);

  return valeursSecteurs;
};
const getTabProps = ({
  isDataSufficient,
}: {
  isDataSufficient: boolean;
}): {
  icon: string;
  iconClassName: string;
  iconPosition: 'left' | 'right';
  title?: string;
} => {
  if (isDataSufficient) {
    return {
      icon: 'checkbox-circle-fill',
      iconClassName: 'text-success-3',
      iconPosition: 'right',
    };
  }

  return {
    icon: 'alert-fill',
    iconClassName: 'text-warning-1',
    iconPosition: 'right',
  };
};

/**
 * Affiche le contenu de la modale permettant de saisir les données de la
 * collectivité et de lancer un nouveau calcul
 */
export const DonneesCollectivite = ({
  onClose,
}: DonneesCollectiviteProps): JSX.Element => {
  const { donneesSectorisees, canComputeTrajectoire } = useDonneesSectorisees();
  const { mutate: upsertValeur } = useUpsertIndicateurValeur();

  const collectiviteId = useCollectiviteId();

  const { mutate: computeTrajectoire, isPending: isComputePending } =
    useComputeTrajectoire({
      onSuccess: onClose,
    });
  return (
    <>
      <Modal.Header>
        <Modal.Title>{appLabels.trajectoireRecalculer}</Modal.Title>
        <Modal.Subtitle>
          {appLabels.trajectoireRecalculerDescription}
        </Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveTab={0}>
          {tabsProperties.map((tab) => {
            const { secteurs, sources, indicateurs, dataCompletionStatus } =
              donneesSectorisees[tab.id];

            return (
              <Tab
                key={tab.id}
                label={tab.label}
                {...getTabProps({
                  isDataSufficient: dataCompletionStatus.isDataSufficient,
                })}
              >
                <Alert
                  className="text-left"
                  state="info"
                  description={tab.description}
                />
                {indicateurs && (
                  <TableauDonnees
                    valeursSecteurs={toTableFormat({ secteurs, indicateurs })}
                    secteurs={secteurs}
                    sources={sources}
                    onChange={({ id, indicateurId, valeur }) => {
                      upsertValeur({
                        id,
                        indicateurId,
                        collectiviteId,
                        dateValeur: DATE_DEBUT_SNBC_V2_REFERENCE,
                        resultat: valeur,
                      });
                    }}
                  />
                )}
              </Tab>
            );
          })}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Button
          icon="arrow-right-line"
          iconPosition="right"
          loading={isComputePending}
          disabled={!canComputeTrajectoire || isComputePending}
          onClick={() => {
            computeTrajectoire({ collectiviteId });
          }}
        >
          {isComputePending
            ? appLabels.trajectoireCalculEnCours
            : appLabels.trajectoireVoirResultat}
        </Button>
      </Modal.Footer>
    </>
  );
};
