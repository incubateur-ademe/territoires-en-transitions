import { appLabels } from '@/app/labels/catalog';
import {
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';

/** Exemples de questions par domaine, tels qu'on les pose à l'assistant. */
export const AssistantExamplesTable = () => (
  <div className="overflow-x-auto rounded-lg border border-grey-3">
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell
            className="w-1/3"
            title={appLabels.assistantExemplesColonneDomaine}
          />
          <TableHeaderCell
            title={appLabels.assistantExemplesColonneQuestions}
          />
        </tr>
      </TableHead>
      <tbody>
        {appLabels.assistantExemples.map((exemple) => (
          <TableRow key={exemple.domaine}>
            <TableCell className="align-top font-bold text-primary-9">
              {exemple.domaine}
            </TableCell>
            <TableCell className="align-top">
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {exemple.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
              {'note' in exemple && (
                <p className="mb-0 mt-2 text-xs text-grey-7">{exemple.note}</p>
              )}
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </div>
);
