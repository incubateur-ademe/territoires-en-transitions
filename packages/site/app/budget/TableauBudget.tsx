import { getFormattedNumber } from '@/site/src/utils/getFormattedNumber';
import classNames from 'classnames';
import { TTableauBudget } from './utils';

type TableauBudgetProps = {
  data: TTableauBudget;
};

const getColumns = (data: { [key: string]: string }) => {
  const columns = [];

  for (const index in data) {
    columns.push({
      index,
      value: data[index],
    });
  }

  return columns.sort((a, b) => parseInt(a.index) - parseInt(b.index));
};

const getTotal = (
  data: { [key: string]: { [key: string]: number } },
  index: string
) => {
  let total = 0;
  for (const line in data) {
    total += data[line][index];
  }
  return total;
};

const TableauBudget = ({ data }: TableauBudgetProps) => {
  const colonnes = getColumns(data.années);
  const lignes = Object.keys(data.tableau);

  const columnWidth = `${100 / (colonnes.length + 1)}%`;

  return (
    <div className="w-full overflow-x-auto my-10">
      <table className="w-full border border-primary-3 text-primary-10 text-xs leading-4 font-medium">
        {/* Première ligne - Années */}
        <thead>
          <tr className="h-[36px] bg-primary-2 border border-primary-3">
            <th
              className="border border-primary-3 text-left max-md:p-1 p-3"
              style={{ width: columnWidth, minWidth: '150px' }}
            ></th>
            {colonnes.map((c) => (
              <th
                key={c.index}
                className={classNames(
                  'border border-primary-3 text-left max-md:max-w-[60px] max-md:break-words max-md:p-1 p-3',
                  {
                    'bg-primary-4': parseInt(c.index) === colonnes.length,
                  }
                )}
                style={{ width: columnWidth, minWidth: '150px' }}
              >
                {c.value}
              </th>
            ))}
          </tr>
        </thead>

        {/* Lignes de données */}
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne} className="h-[36px] border border-primary-3">
              <td className="border border-primary-3 text-primary-9 max-md:p-1 p-3">
                {ligne}
              </td>
              {colonnes.map((c) => (
                <td
                  key={`${ligne}-${c.index}`}
                  className={classNames(
                    'border border-primary-3 max-md:p-1 p-3',
                    {
                      'bg-primary-0': parseInt(c.index) === colonnes.length,
                    }
                  )}
                >
                  {getFormattedNumber(data.tableau[ligne][c.index])} €
                </td>
              ))}
            </tr>
          ))}

          {/* Dernière ligne - Total TTC */}
          <tr className="h-[36px] bg-primary-0 border border-primary-3">
            <td className="border border-primary-3 text-primary-9 max-md:p-1 p-3">
              Total TTC
            </td>
            {colonnes.map((c) => (
              <td
                key={`Total-${c.index}`}
                className="border border-primary-3 font-bold max-md:p-1 p-3"
              >
                {getFormattedNumber(getTotal(data.tableau, c.index))} €
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TableauBudget;
