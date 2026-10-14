import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  MAX_GRID_VALEURS_BATCH_SIZE,
  type IndicateurPeriode,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import {
  Button,
  Field,
  FieldMessage,
  Input,
  Modal,
  ModalFooter,
  Select,
} from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { useId, useRef, useState } from 'react';

type ColumnPeriodicite = Exclude<
  IndicateurPeriodicite,
  typeof IndicateurPeriodiciteEnum.ANNUELLE
>;

const columnOptions = {
  [IndicateurPeriodiciteEnum.MENSUELLE]: {
    label: appLabels.indicateurSelectMois,
    options: appLabels.indicateurMois.map((label, index) => ({
      label,
      value: String(index + 1).padStart(2, '0'),
    })),
  },
  [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: {
    label: appLabels.indicateurSelectTrimestre,
    options: [1, 2, 3, 4].map((numero) => ({
      label: appLabels.indicateurTrimestreCourt(numero),
      value: `T${numero}`,
    })),
  },
  [IndicateurPeriodiciteEnum.SEMESTRIELLE]: {
    label: appLabels.indicateurSelectSemestre,
    options: [1, 2].map((numero) => ({
      label: appLabels.indicateurSemestreCourt(numero),
      value: `S${numero}`,
    })),
  },
} satisfies Record<
  ColumnPeriodicite,
  { label: string; options: { label: string; value: string }[] }
>;

type ColumnDraft = { id: number; sousPeriode: string; annee: string };

type Props = {
  periodicite: ColumnPeriodicite;
  existingPeriodes: readonly IndicateurPeriode[];
  openState: OpenState;
  onAdd: (periodes: IndicateurPeriode[]) => Promise<void>;
};

/** Declares empty columns; values and comments are edited in the table. */
export const AddIndicateurPeriodesModal = ({
  periodicite,
  existingPeriodes,
  openState,
  onAdd,
}: Props) => {
  const formId = useId();
  const nextId = useRef(1);
  const savingRef = useRef(false);
  const [columns, setColumns] = useState<ColumnDraft[]>([
    { id: 0, sousPeriode: '', annee: '' },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const { label, options } = columnOptions[periodicite];
  const existingKeys = new Set(existingPeriodes.map(IndicateurPeriodes.key));
  const periodes = columns.map(({ annee, sousPeriode }) =>
    IndicateurPeriodes.tryParse(periodicite, `${annee}-${sousPeriode}`)
  );
  const keys = periodes.map((periode) =>
    periode ? IndicateurPeriodes.key(periode) : null
  );
  const errors = columns.map(({ annee, sousPeriode }, index) => {
    if (!annee || !sousPeriode) return undefined;
    const periode = periodes[index];
    const key = keys[index];
    if (!periode) return appLabels.indicateurAnneeInvalide(1, 9999);
    if (
      key &&
      (existingKeys.has(key) ||
        keys.some((other, i) => i !== index && other === key))
    ) {
      return appLabels.indicateurColonneExistante(
        IndicateurPeriodes.format(periode)
      );
    }
    return undefined;
  });
  const incomplete = columns.some(
    ({ annee, sousPeriode }) => !annee || !sousPeriode
  );

  const changeColumn = (
    id: number,
    change: Partial<Omit<ColumnDraft, 'id'>>
  ) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === id ? { ...column, ...change } : column
      )
    );
    setSaveFailed(false);
  };

  const submit = async () => {
    setSubmitted(true);
    if (savingRef.current || incomplete || errors.some(Boolean)) return;
    const validPeriodes = periodes.filter((periode) => periode !== null);
    if (validPeriodes.length !== columns.length) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveFailed(false);
    try {
      await onAdd(validPeriodes);
      openState.setIsOpen(false);
    } catch {
      setSaveFailed(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={getIndicateurPeriodPresentation(periodicite).editor.addLabel}
      openState={openState}
      size="md"
      scrollableContent
      disableDismiss={isSaving}
      noCloseButton={isSaving}
      render={() => (
        <form
          id={formId}
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {columns.map((column, index) => (
            <div
              key={column.id}
              role="group"
              aria-label={appLabels.indicateurColonne(index + 1)}
            >
              <div className="flex items-start gap-3">
                <Field className="w-36 min-w-0 flex-none !grow-0">
                  <Select
                    options={options}
                    values={column.sousPeriode || undefined}
                    onChange={(value) => {
                      if (value !== undefined) {
                        changeColumn(column.id, { sousPeriode: String(value) });
                      }
                    }}
                    disabled={isSaving}
                    custom={{
                      triggerButton: {
                        button: (
                          <Button
                            type="button"
                            variant="grey"
                            icon="arrow-down-s-line"
                            iconPosition="right"
                            className="h-12 w-full justify-between px-3 font-normal text-sm"
                            aria-label={label}
                            dataTest="indicateurs.periodes.select"
                            disabled={isSaving}
                          >
                            {options.find(
                              (option) => option.value === column.sousPeriode
                            )?.label ?? label}
                          </Button>
                        ),
                      },
                    }}
                  />
                </Field>
                <Field className="min-w-0 flex-1">
                  <Input
                    aria-label={appLabels.annee}
                    placeholder={appLabels.annee}
                    type="text"
                    inputMode="numeric"
                    value={column.annee}
                    disabled={isSaving}
                    state={submitted && errors[index] ? 'error' : 'default'}
                    className="min-w-0"
                    aria-invalid={submitted && !!errors[index]}
                    aria-describedby={
                      submitted && errors[index]
                        ? `${formId}-${column.id}-error`
                        : undefined
                    }
                    data-test="indicateurs.periodes.annee"
                    onChange={(event) =>
                      changeColumn(column.id, { annee: event.target.value })
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="unstyled"
                  icon="close-line"
                  className="h-12 px-2 text-grey-6 disabled:invisible"
                  title={appLabels.indicateurRetirerColonne}
                  aria-label={appLabels.indicateurRetirerColonne}
                  disabled={isSaving || columns.length === 1}
                  dataTest="indicateurs.periodes.remove"
                  onClick={() =>
                    setColumns((current) =>
                      current.filter(({ id }) => id !== column.id)
                    )
                  }
                />
              </div>
              {submitted && errors[index] && (
                <div id={`${formId}-${column.id}-error`}>
                  <FieldMessage state="error" message={errors[index]} />
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="link"
            icon="add-line"
            disabled={isSaving || columns.length >= MAX_GRID_VALEURS_BATCH_SIZE}
            dataTest="indicateurs.periodes.add-row"
            onClick={() => {
              const id = nextId.current++;
              setColumns((current) => [
                ...current,
                { id, sousPeriode: '', annee: '' },
              ]);
            }}
          >
            {appLabels.indicateurAjouterAutreColonne}
          </Button>
          {saveFailed && (
            <FieldMessage
              state="error"
              message={appLabels.indicateurColonnesAjouteesErreur}
            />
          )}
        </form>
      )}
      renderFooter={({ close }) => (
        <ModalFooter>
          <Button variant="outlined" onClick={close} disabled={isSaving}>
            {appLabels.annuler}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={incomplete || isSaving}
            loading={isSaving}
            dataTest="indicateurs.periodes.submit"
          >
            {appLabels.ajouter}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
