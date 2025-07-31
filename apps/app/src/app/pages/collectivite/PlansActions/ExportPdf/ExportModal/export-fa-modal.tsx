import ExportFicheActionButton from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportFicheActionButton';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { Button, ButtonProps, Modal, ModalFooter } from '@/ui';
import { useState } from 'react';
import ExportFicheActionGroupeesButton from '../ExportFicheActionGroupeesButton';
import { sectionsInitValue } from '../utils';
import ExportFicheActionTable from './export-fa-table';

type Props = {
  fiche?: Fiche;
  fichesIds?: number[];
  buttonProps?: Pick<
    ButtonProps,
    | 'children'
    | 'title'
    | 'variant'
    | 'size'
    | 'icon'
    | 'iconPosition'
    | 'disabled'
  >;
};

const defaultButtonProps: ButtonProps = {
  title: 'Exporter en PDF',
  variant: 'grey',
  size: 'xs',
  icon: 'download-fill',
  iconPosition: 'left',
  disabled: false,
};

const ExportFicheActionModal = ({
  fiche,
  fichesIds,
  buttonProps = defaultButtonProps,
}: Props) => {
  const [options, setOptions] = useState(sectionsInitValue);

  return (
    <Modal
      title="Exporter en PDF"
      subTitle="Paramètres de l’export"
      size="xl"
      render={() => <ExportFicheActionTable {...{ options, setOptions }} />}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          {!!fiche && (
            <ExportFicheActionButton
              fiche={fiche}
              options={options}
              disabled={!Object.values(options).find((opt) => opt.isChecked)}
              onDownloadEnd={() => {
                close();
                setOptions(sectionsInitValue);
              }}
            />
          )}
          {!!fichesIds && (
            <ExportFicheActionGroupeesButton
              fichesIds={fichesIds}
              options={options}
              disabled={!Object.values(options).find((opt) => opt.isChecked)}
              onDownloadEnd={() => {
                close();
                setOptions(sectionsInitValue);
              }}
            />
          )}
        </ModalFooter>
      )}
    >
      <Button {...buttonProps} />
    </Modal>
  );
};

export default ExportFicheActionModal;
