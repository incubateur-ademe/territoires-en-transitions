import { appLabels } from '@/app/labels/catalog';
import {
  Checkbox,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
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
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-grey-3">
      <Table className="table-auto">
        <TableHead>
          <tr>
            <TableHeaderCell className="min-w-80" title={appLabels.sections} />
            <TableHeaderCell
              className="w-96"
              title={appLabels.personnaliserSection}
            />
            <TableHeaderCell
              className="min-w-52"
              align="center"
              title={appLabels.ajouterAExportPdf}
            />
          </tr>
        </TableHead>
        <tbody>
          {sectionsList.map((section) => (
            <TableRow key={section.key}>
              {/* Sections */}
              <TableCell className="text-primary-10 font-bold text-sm">
                {section.title}
              </TableCell>

              {/* Personnalisation */}
              <TableCell className="px-3 py-1">
                {section.key === 'notes' ? (
                  <ExportSuiviSelect {...{ options, setOptions }} />
                ) : (
                  ''
                )}
              </TableCell>

              {/* Sélection */}
              <TableCell>
                <Checkbox
                  className="mx-auto"
                  checked={options[section.key].isChecked}
                  onChange={(evt) =>
                    handleOnCheck(section.key, evt.currentTarget.checked)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ExportFicheActionTable;
