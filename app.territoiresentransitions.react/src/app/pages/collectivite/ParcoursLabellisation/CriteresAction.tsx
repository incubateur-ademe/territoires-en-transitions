import {
  CritereLabellisationAction,
  LabellisationParcoursRead,
} from 'generated/dataLayer/labellisation_parcours_read';
import {referentielToName} from 'app/labels';
import {makeCollectiviteActionUrl} from 'app/paths';
import './CriteresAction.css';

export type TCriteresActionProps = {
  collectiviteId: number;
  parcours: LabellisationParcoursRead;
};

type TCriteresActionTable = TCriteresActionProps & {
  onClickRow: (action: CritereLabellisationAction) => void;
};

/**
 * Affiche les critères liés aux actions
 */
export const CriteresAction = (props: TCriteresActionProps) => {
  const {collectiviteId, parcours} = props;
  const {referentiel} = parcours;

  const onClickRow = ({action_id}: CritereLabellisationAction): void => {
    const levels = action_id.split('.');
    const limitedLevels = levels
      .slice(0, referentiel === 'cae' ? 3 : 2)
      .join('.');

    const pathname = makeCollectiviteActionUrl({
      collectiviteId,
      referentielId: referentiel,
      actionId: limitedLevels,
    });
    window.open(
      pathname + (levels.length !== limitedLevels.length ? `#${action_id}` : '')
    );
  };

  return (
    <>
      <li className=" fr-mt-2w fr-mb-1w">
        Être une collectivité engagée dans une politique{' '}
        {referentielToName[referentiel]} et le prouver (via les documents
        preuves ou un texte justificatif)
      </li>
      <CritereActionTable {...props} onClickRow={onClickRow} />
    </>
  );
};

/**
 * Affiche le tableau des critères liés aux actions
 */
export const CritereActionTable = (props: TCriteresActionTable) => {
  const {parcours} = props;
  const {etoiles} = parcours;
  const {criteres_action} = parcours;

  return (
    <div className="critere-action-table fr-my-4">
      <table>
        <thead>
          <tr>
            <th className="pl-10" colSpan={3}>
              Sous-action ou tâche
            </th>
            <th className="pr-6">Statut ou score requis</th>
          </tr>
        </thead>
        <tbody>
          {criteres_action.map((c, index) =>
            // affiche le critère si il est associé au même niveau de
            // labellisation que le parcours ou si il n'est pas encore rempli
            c.etoile === etoiles || !c.rempli ? (
              <CritereActionRow
                key={`${c.etoile}.${index + 1}`}
                rowIndex={index}
                {...props}
              />
            ) : null
          )}
        </tbody>
      </table>
    </div>
  );
};

/** Affiche une ligne du tableau */
const CritereActionRow = (props: TCriteresActionTable & {rowIndex: number}) => {
  const {rowIndex, parcours, onClickRow} = props;
  const {criteres_action} = parcours;
  const action = criteres_action[rowIndex];
  const {action_identifiant, formulation, statut_ou_score, rempli} = action;

  return (
    <tr onClick={() => onClickRow(action)}>
      <td className="text-center w-[56px]">
        {rempli ? (
          <i className="fr-icon fr-fi-checkbox-circle-fill before:text-[#5FD68C]" />
        ) : null}
      </td>
      <td className="text-right text-xs w-[40px] text-grey625">
        <span>{action_identifiant}</span>
      </td>
      <td className="pl-4 pr-8">{formulation}</td>
      <td>{statut_ou_score}</td>
    </tr>
  );
};
