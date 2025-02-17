import { FicheAction } from '@/api/plan-actions';
import ExportFicheActionButton from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportFicheActionButton';
import {
  Button,
  ButtonProps,
  Checkbox,
  Modal,
  ModalFooter,
  TBody,
  TCell,
  THead,
  TRow,
  Table,
} from '@/ui';
import { useState } from 'react';
import { sectionsInitValue, sectionsList } from './utils';

type Props = {
  fiche: FicheAction;
  buttonProps?: Pick<
    ButtonProps,
    'children' | 'title' | 'variant' | 'size' | 'icon' | 'iconPosition'
  >;
};

const defaultButtonProps: ButtonProps = {
  title: 'Exporter en PDF',
  variant: 'grey',
  size: 'xs',
  icon: 'download-fill',
  iconPosition: 'left',
};

const ExportFicheActionModal = ({
  fiche,
  buttonProps = defaultButtonProps,
}: Props) => {
  const [options, setOptions] = useState(sectionsInitValue);

  return (
    <Modal
      title="Exporter en PDF"
      subTitle="Paramètres de l’export"
      size="xl"
      render={() => (
        <Table className="border-[0.5px] border-primary-4">
          <THead>
            <TRow className="bg-primary-2 text-primary-9 font-bold text-sm">
              <TCell>Sections</TCell>
              <TCell>Ajouter à l’export PDF</TCell>
            </TRow>
          </THead>
          <TBody>
            {sectionsList.map((section) => (
              <TRow key={section.key}>
                <TCell className="text-primary-10 font-bold text-sm">
                  {section.title}
                </TCell>
                <TCell>
                  <Checkbox
                    checked={options[section.key].isChecked}
                    onChange={(evt) => {
                      const newValue = {
                        ...options[section.key],
                        isChecked: evt.currentTarget.checked,
                      };
                      const newOptions = {
                        ...options,
                        [section.key as string]: newValue,
                      };
                      setOptions(newOptions);
                    }}
                    className="mx-auto"
                  />
                </TCell>
              </TRow>
            ))}
          </TBody>
        </Table>
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          <ExportFicheActionButton fiche={fiche} options={options} />
        </ModalFooter>
      )}
    >
      <Button {...buttonProps} />
    </Modal>
  );
};

export default ExportFicheActionModal;
