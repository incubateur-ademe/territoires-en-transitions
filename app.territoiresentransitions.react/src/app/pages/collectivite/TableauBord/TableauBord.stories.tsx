import {Meta} from '@storybook/react';
import {TableauBord} from './TableauBord';
import actions from '../../../../fixtures/referentiel_down_to_action.json';

export default {
  component: TableauBord,
} as Meta;

const scores = {
  eci: [],
  cae: [],
};
const demande = {eci: null, cae: null};
const labellisationParNiveau = {eci: null, cae: null};
export const EmotyReferentiels = () => (
  <TableauBord
    scores={scores}
    demande={demande}
    labellisationParNiveau={labellisationParNiveau}
    actions={actions}
  />
);
