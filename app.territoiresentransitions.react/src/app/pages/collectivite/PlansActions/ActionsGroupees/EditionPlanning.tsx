import { Button, Checkbox, Field, Input, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useRef, useState } from 'react';
import { getIsoFormattedDate } from 'utils/formatUtils';
import ActionsGroupeesModale from './ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from './useFichesActionsBulkEdit';

type ModaleEditionPlanningProps = {
  openState: OpenState;
  selectedIds: number[];
};

const ModaleEditionPlanning = ({
  openState,
  selectedIds,
}: ModaleEditionPlanningProps) => {
  const [dateFinProvisoire, setDateFinProvisoire] = useState<
    string | null | undefined
  >();
  const [ameliorationContinue, setAmeliorationContinue] = useState(false);

  const collectiviteId = useCollectiviteId()!;
  const tracker = useEventTracker('app/actions-groupees-fiches-action');

  const mutation = useFichesActionsBulkEdit();

  const dateFinRef = useRef<HTMLInputElement>(null);

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un planning"
      actionsCount={selectedIds.length}
      // TODO: sauvegarde de la nouvelle valeur
      onSave={() => {
        tracker('associer_priorite_groupe', {
          collectivite_id: collectiviteId,
        });
        mutation.mutate({
          ficheIds: selectedIds,
        });
      }}
    >
      {/* TODO: check dates de début des fiches sélectionnées ? */}
      <Field title="Date de fin prévisionnelle" className="col-span-2">
        <Input
          ref={dateFinRef}
          type="date"
          title={
            ameliorationContinue
              ? "Ce champ ne peut pas être modifié si l'action se répète tous les ans"
              : undefined
          }
          disabled={ameliorationContinue ?? false}
          value={
            dateFinProvisoire ? getIsoFormattedDate(dateFinProvisoire) : ''
          }
          onChange={(evt) => {
            setDateFinProvisoire(
              evt.target.value.length !== 0 ? evt.target.value : null
            );
          }}
        />

        <div className="col-span-2 mt-2">
          <Checkbox
            label="Action en amélioration continue, sans date de fin"
            checked={ameliorationContinue}
            onChange={(evt) => {
              const isChecked = evt.currentTarget.checked;
              const dateFin = isChecked ? null : dateFinProvisoire;
              setAmeliorationContinue(isChecked);
              setDateFinProvisoire(dateFin);
            }}
          />
        </div>
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionPlanningProps = {
  selectedIds: number[];
};

const EditionPlanning = ({ selectedIds }: EditionPlanningProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon="calendar-2-line"
        size="xs"
        variant="outlined"
        onClick={() => setIsModalOpen(true)}
      >
        Associer un planning
      </Button>
      {isModalOpen && (
        <ModaleEditionPlanning
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};

export default EditionPlanning;
