import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
  useSaveActionStatuts,
} from '@/app/referentiels/actions/action-statut/use-action-statut';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  StatutAvancementEnum,
  StatutAvancementIncludingNonConcerne,
  StatutAvancementIncludingNonConcerneDetailleALaTache,
  getStatutAvancement,
} from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { useEffect, useState } from 'react';
import { useScore } from '../use-snapshot';
import { statutParAvancement } from '../utils';
import AvancementDetailleModal from './avancement-detaille/avancement-detaille.modal';
import SubActionModal from './sub-action/sub-action.modal';

export type StatusToSavePayload = {
  actionId: string;
  statut: ActionStatutCreate | null;
  avancement: StatutAvancementIncludingNonConcerne;
  avancementDetaille?: number[];
};

export type OpenModaleState = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

type Props = {
  actionDefinition: ActionDefinitionSummary;
};

export const SubActionStatutDropdown = ({ actionDefinition }: Props) => {
  const collectivite = useCurrentCollectivite();

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(actionDefinition.id);

  // Récupère les données liées au score
  const score = useScore(actionDefinition.id);

  // Fonction de sauvegarde du statut
  const { saveActionStatut } = useSaveActionStatut();
  const { mutate: saveActionStatuts } = useSaveActionStatuts();

  // Arguments renvoyés lors de la sauvegarde d'un nouveau statut
  const args = {
    actionId: actionDefinition.id,
    collectiviteId: collectivite.collectiviteId,
  };

  // Informations sur l'avancement de la sous-mesure / tâche
  const { statut, filled, filledByChildren } = useActionStatut(
    actionDefinition.id
  );
  const { avancement, avancementDetaille, concerne } = statut || {};

  /**
   * @deprecated Supprimer cette logique du front pour la faire uniquement côté back
   * Le `useActionStatut` devrait déjà renvoyer le bon statut à manipuler directement dans le front
   */
  const avancementExt = getStatutAvancement({
    avancement: avancement,
    desactive: score?.desactive,
    concerne,
  });

  // Statut et tableau d'avancement détaillé locaux au dropdown (inclut 'detaille_a_la_tache' pour l'affichage)
  const [localAvancement, setLocalAvancement] =
    useState<StatutAvancementIncludingNonConcerneDetailleALaTache>(
      avancementExt
    );
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancementDetaille);

  // Gestion de l'ouverture des modales de score détaillé
  const [openSubActionModal, setOpenSubActionModal] = useState(false);
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);

  const isSubActionWithTasks =
    actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
    actionDefinition.children.length > 0;

  // Permet la mise à jour du dropdown si un autre élément
  // de la sous-action a changé de statut
  useEffect(() => {
    if (
      isSubActionWithTasks &&
      avancementExt === 'non_renseigne' &&
      concerne !== false &&
      filled
    ) {
      setLocalAvancement('detaille_a_la_tache');
    } else {
      setLocalAvancement(avancementExt);
    }
    setLocalAvancementDetaille(avancementDetaille);
  }, [
    avancementExt,
    avancementDetaille,
    concerne,
    filled,
    isSubActionWithTasks,
  ]);

  // Mise à jour du statut lorsque une nouvelle valeur
  // est sélectionnée sur le dropdown
  const handleChange = (
    value: StatutAvancementIncludingNonConcerneDetailleALaTache
  ) => {
    const {
      avancement,
      concerne,
      avancementDetaille: avancement_detaille,
    } = statutParAvancement(value);

    const argsToSave = {
      ...args,
      ...statut,
      avancement,
      avancementDetaille: avancement_detaille,
      concerne,
    };

    // Logique de sauvegarde à revoir si remplacement
    // de la modale <SubActionModal /> par un panneau latéral
    if (avancement === 'detaille') {
      setLocalAvancementDetaille(avancement_detaille);
      setOpenScoreDetaille(true);
    } else if (value === 'detaille_a_la_tache') {
      setLocalAvancementDetaille(undefined);
      setOpenSubActionModal(true);
    } else {
      // Mise à jour dans les cas de statuts autres que détaillé
      setLocalAvancement(value);
      setLocalAvancementDetaille(avancement_detaille);

      // Sauvegarde du nouveau statut
      if (
        argsToSave.avancement !== 'non_renseigne' ||
        !filledByChildren?.length
      ) {
        saveActionStatut({
          ...argsToSave,
          avancementDetaille:
            actionDefinition.type === ActionTypeEnum.SOUS_ACTION
              ? localAvancementDetaille
              : avancement_detaille,
        });
      } else {
        // Save the statut of the children to non_renseigne
        const childActionStatuts: ActionStatutCreate[] = filledByChildren.map(
          (childActionId) => ({
            collectiviteId: collectivite.collectiviteId,
            actionId: childActionId,
            avancement: 'non_renseigne',
            avancementDetaille: null,
            concerne: true,
          })
        );
        saveActionStatuts({
          actionStatuts: [
            {
              collectiviteId: collectivite.collectiviteId,
              actionId: actionDefinition.id,
              avancement: 'non_renseigne',
              avancementDetaille: null,
              concerne: true,
            },
            ...childActionStatuts,
          ],
        });
      }
    }
  };

  const showPenButton =
    !disabled &&
    (localAvancement === 'detaille' ||
      localAvancement === 'detaille_a_la_tache');

  const allOrderedStatutItems = [
    StatutAvancementEnum.FAIT,
    StatutAvancementEnum.PAS_FAIT,
    StatutAvancementEnum.PROGRAMME,
    StatutAvancementEnum.DETAILLE,
    StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    StatutAvancementEnum.NON_CONCERNE,
    StatutAvancementEnum.NON_RENSEIGNE,
  ];
  const filteredStatutItems = isSubActionWithTasks
    ? allOrderedStatutItems
    : allOrderedStatutItems.filter(
        (item) => item !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
      );

  return (
    <>
      {/* Dropdown + bouton crayon pour ouvrir la modale détaillée */}
      <div
        onClick={(evt) => evt.stopPropagation()}
        className="flex items-center gap-2"
      >
        <SelectActionStatut
          items={filteredStatutItems}
          disabled={disabled}
          value={localAvancement}
          onChange={handleChange}
        />
        {showPenButton && (
          <Button
            data-test="DetaillerAvancementButton"
            icon="edit-line"
            title="Détailler l'avancement"
            variant="underlined"
            size="xs"
            onClick={() => {
              if (localAvancement === 'detaille_a_la_tache') {
                setOpenSubActionModal(true);
              } else {
                setOpenScoreDetaille(true);
              }
            }}
          />
        )}
      </div>

      {/* Modale de détail de la sous-action (liste des tâches + jaude de score détaillé) */}
      {openSubActionModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <SubActionModal
            actionDefinition={actionDefinition}
            openState={{
              isOpen: openSubActionModal,
              setIsOpen: (value) => {
                setOpenSubActionModal(value);
              },
            }}
          />
        </div>
      )}

      {/* Modale de score détaillé */}
      {openScoreDetaille && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <AvancementDetailleModal
            actionDefinition={actionDefinition}
            openState={{
              isOpen: openScoreDetaille,
              setIsOpen: (value) => {
                setOpenScoreDetaille(value);
              },
            }}
          />
        </div>
      )}
    </>
  );
};
