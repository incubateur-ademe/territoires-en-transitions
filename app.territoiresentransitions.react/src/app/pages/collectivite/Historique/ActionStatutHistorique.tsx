import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';

export type TActionStatutHistoriqueProps = IHistoricalActionStatutRead;

export const ActionStatutHistorique = (props: TActionStatutHistoriqueProps) => (
  <div>
    <div>props : {JSON.stringify(props)}</div>
  </div>
);
