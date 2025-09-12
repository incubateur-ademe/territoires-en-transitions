import { getIsoFormattedDate } from '@/app/utils/formatUtils';
import { BulkEditRequest } from '@/domain/plans/fiches';
import { Button, Checkbox, Event, Field, Input, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useRef, useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionPlanningProps = {
  openState: OpenState;
  onUpdate: (
    input: Pick<BulkEditRequest, 'dateFin' | 'ameliorationContinue'>
  ) => void;
};

const ModaleEditionPlanning = ({
  openState,
  onUpdate,
}: ModaleEditionPlanningProps) => {
  const [dateFin, setDateFin] = useState<string | null | undefined>();
  const [ameliorationContinue, setAmeliorationContinue] = useState<
    boolean | null
  >(null);

  const tracker = useEventTracker();

  const dateFinRef = useRef<HTMLInputElement>(null);

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un planning"
      onSave={() => {
        tracker(Event.fiches.updatePlanningGroupe);
        onUpdate({
          dateFin,
          ameliorationContinue,
        });
      }}
    >
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
          value={dateFin ? getIsoFormattedDate(dateFin) : ''}
          min={undefined}
          onChange={(evt) => {
            setAmeliorationContinue(null);
            setDateFin(evt.target.value.length !== 0 ? evt.target.value : null);
          }}
        />

        <div className="col-span-2 mt-2">
          <Checkbox
            label="L'action se répète tous les ans"
            message="Sans date de fin prévisionnelle"
            checked={ameliorationContinue ?? false}
            onChange={(evt) => {
              const isChecked = evt.currentTarget.checked;
              setAmeliorationContinue(isChecked);
              setDateFin(isChecked ? null : dateFin);
            }}
          />
        </div>
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionPlanningProps = {
  onUpdate: (
    input: Pick<BulkEditRequest, 'dateFin' | 'ameliorationContinue'>
  ) => void;
};

const EditionPlanning = ({ onUpdate }: EditionPlanningProps) => {
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
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionPlanning;
