import { Checkbox, TBody, TCell, THead, TRow, Table } from '@/ui';
import { PdfSectionKey, TSectionsValues, sectionsList } from '../utils';
import ExportSuiviSelect from './export-suivi-select';

type Props = {
  options: TSectionsValues;
  setOptions: (values: TSectionsValues) => void;
};

const ExportFicheActionTable = ({ options, setOptions }: Props) => {
  const handleOnCheck = (key: PdfSectionKey, checked: boolean) => {
    const newValue = {
      ...options[key],
      isChecked: checked,
    };
    const newOptions = {
      ...options,
      [key as string]: newValue,
    };
    setOptions(newOptions);
  };

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <Table className="border-[0.5px] border-primary-4">
        {/* En-tête du tableau */}
        <THead>
          <TRow className="bg-primary-2 text-primary-9 font-bold text-sm">
            <TCell className="min-w-80">Sections</TCell>
            <TCell className="min-w-80">Personnaliser la section</TCell>
            <TCell className="min-w-52">Ajouter à l’export PDF</TCell>
          </TRow>
        </THead>

        {/* Contenu du tableau */}
        <TBody>
          {sectionsList.map((section) => (
            <TRow key={section.key}>
              {/* Sections */}
              <TCell className="text-primary-10 font-bold text-sm">
                {section.title}
              </TCell>

              {/* Personnalisation */}
              <TCell className="!px-3 !py-1">
                {section.key === 'notes_suivi' ? (
                  <ExportSuiviSelect {...{ options, setOptions }} />
                ) : (
                  ''
                )}
              </TCell>

              {/* Sélection */}
              <TCell>
                <Checkbox
                  className="mx-auto"
                  checked={options[section.key].isChecked}
                  onChange={(evt) =>
                    handleOnCheck(section.key, evt.currentTarget.checked)
                  }
                />
              </TCell>
            </TRow>
          ))}
        </TBody>
      </Table>
    </div>
  );
};

export default ExportFicheActionTable;
