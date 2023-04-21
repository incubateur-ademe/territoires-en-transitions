import {useState} from 'react';
import {Dialog} from '@material-ui/core';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from 'core-logic/hooks/useActionStatut';
import {toPercentString} from 'utils/score';
import {CloseDialogButton} from '../shared/CloseDialogButton';
import {DetailedScore} from '../shared/DetailedScore/DetailedScore';
import {AvancementValues} from '../shared/DetailedScore/DetailedScoreSlider';
import {TActionAvancement, TActionAvancementExt} from 'types/alias';
import {
  ITEMS_AVEC_NON_CONCERNE,
  SelectActionStatut,
} from 'ui/shared/actions/SelectActionStatut';

// valeurs par défaut de l'avancement détaillé par statut d'avancement
const AVANCEMENT_DETAILLE_PAR_STATUT: Record<
  TActionAvancement,
  number[] | undefined
> = {
  non_renseigne: undefined,
  fait: [1, 0, 0],
  programme: [0, 1, 0],
  pas_fait: [0, 0, 1],
  detaille: [0.3, 0.4, 0.3],
};

export const ActionStatusDropdown = ({actionId}: {actionId: string}) => {
  const [opened, setOpened] = useState(false);

  const collectivite = useCurrentCollectivite();
  const args = {
    action_id: actionId,
    collectivite_id: collectivite?.collectivite_id || 0,
  };
  const {statut} = useActionStatut(args);
  const {avancement, avancement_detaille} = statut || {};

  const score = useActionScore(actionId);
  const {concerne, desactive} = score || {};
  const avancementExt = getAvancementExt({avancement, desactive, concerne});

  const {saveActionStatut} = useSaveActionStatut(args);

  // détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(actionId);

  const handleChange = (value: TActionAvancementExt) => {
    const {avancement, concerne, avancement_detaille} =
      statutParAvancement(value);
    saveActionStatut({
      ...args,
      ...statut,
      avancement,
      concerne,
      avancement_detaille,
    });
    if (avancement === 'detaille') {
      setOpened(true);
    }
  };

  const handleSaveDetail = (values: number[]) => {
    if (statut) {
      saveActionStatut({
        ...args,
        ...statut,
        avancement: 'detaille',
        avancement_detaille: values,
      });
      setOpened(false);
    }
  };

  if (!collectivite) {
    return null;
  }

  return (
    <div className="flex flex-col items-end w-full">
      <SelectActionStatut
        items={ITEMS_AVEC_NON_CONCERNE}
        disabled={disabled}
        value={avancementExt}
        onChange={handleChange}
      />

      {avancement === 'detaille' && !score?.desactive ? (
        <div className="flex flex-col items-start w-full">
          {avancement_detaille?.length === 3 ? (
            <ul className="mt-6 text-sm">
              <li>
                Fait :&nbsp;
                {toPercentString(avancement_detaille[0])}
              </li>
              <li>
                Programmé :&nbsp;
                {toPercentString(avancement_detaille[1])}
              </li>
              <li>
                Pas fait :&nbsp;
                {toPercentString(avancement_detaille[2])}
              </li>
            </ul>
          ) : null}
          {disabled ? null : (
            <>
              <button
                className="fr-btn fr-btn--sm"
                onClick={() => setOpened(true)}
              >
                Préciser l'avancement
              </button>
              <Dialog
                open={opened}
                onClose={() => setOpened(false)}
                maxWidth="sm"
                fullWidth={true}
              >
                <div className="p-7 flex flex-col items-center">
                  <CloseDialogButton setOpened={setOpened} />
                  <h3 className="py-4">Préciser l’avancement de cette tâche</h3>
                  <div className="w-full">
                    <DetailedScore
                      avancement={
                        (avancement_detaille?.length === 3
                          ? avancement_detaille
                          : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
                      }
                      onSave={handleSaveDetail}
                    />
                  </div>
                </div>
              </Dialog>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

// génère les propriétés de l'objet statut à écrire lors du changement de l'avancement
const statutParAvancement = (avancement: TActionAvancementExt) => {
  // cas spécial pour le faux statut "non concerné"
  if (avancement === 'non_concerne') {
    return {
      avancement: 'non_renseigne' as TActionAvancement,
      concerne: false,
    };
  }

  return {
    avancement,
    // quand on change l'avancement, l'avancement détaillé est réinitialisé à la
    // valeur par défaut correspondante
    avancement_detaille: AVANCEMENT_DETAILLE_PAR_STATUT[avancement],
    concerne: true,
  };
};

/**
 * Détermine l'avancement "étendu" d'une action (inclus le "non concerné")
 */
const getAvancementExt = ({
  avancement,
  desactive,
  concerne,
}: {
  avancement: TActionAvancement | undefined;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
}): TActionAvancementExt | undefined => {
  // affiche le statut "non concerné" quand l'action est désactivée par la
  // personnalisation ou que l'option "non concerné" a été sélectionnée
  // explicitement par l'utilisateur
  if (desactive || concerne === false) {
    return 'non_concerne';
  }
  return avancement;
};
