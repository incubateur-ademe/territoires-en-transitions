import {
  Checkbox,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_TRow,
  DEPRECATED_Table,
} from '@tet/ui';
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
      <DEPRECATED_Table className="border-[0.5px] border-primary-4">
        {/* En-tête du tableau */}
        <DEPRECATED_THead>
          <DEPRECATED_TRow className="bg-primary-2 text-primary-9 font-bold text-sm">
            <DEPRECATED_TCell className="min-w-80">Sections</DEPRECATED_TCell>
            <DEPRECATED_TCell className="min-w-80">
              Personnaliser la section
            </DEPRECATED_TCell>
            <DEPRECATED_TCell className="min-w-52">
              Ajouter à l’export PDF
            </DEPRECATED_TCell>
          </DEPRECATED_TRow>
        </DEPRECATED_THead>

        {/* Contenu du tableau */}
        <DEPRECATED_TBody>
          {sectionsList.map((section) => (
            <DEPRECATED_TRow key={section.key}>
              {/* Sections */}
              <DEPRECATED_TCell className="text-primary-10 font-bold text-sm">
                {section.title}
              </DEPRECATED_TCell>

              {/* Personnalisation */}
              <DEPRECATED_TCell className="!px-3 !py-1">
                {section.key === 'notes_suivi' ? (
                  <ExportSuiviSelect {...{ options, setOptions }} />
                ) : (
                  ''
                )}
              </DEPRECATED_TCell>

              {/* Sélection */}
              <DEPRECATED_TCell>
                <Checkbox
                  className="mx-auto"
                  checked={options[section.key].isChecked}
                  onChange={(evt) =>
                    handleOnCheck(section.key, evt.currentTarget.checked)
                  }
                />
              </DEPRECATED_TCell>
            </DEPRECATED_TRow>
          ))}
        </DEPRECATED_TBody>
      </DEPRECATED_Table>
    </div>
  );
};

export default ExportFicheActionTable;
