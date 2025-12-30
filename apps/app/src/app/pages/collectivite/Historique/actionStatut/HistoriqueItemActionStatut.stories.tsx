import {Meta} from '@storybook/nextjs-vite';

import HistoriqueItemActionStatut from './HistoriqueItemActionStatut';
import {THistoriqueItemProps} from '../types';
import {
  fakeAjoutSimpleActionStatutHistorique,
  fakeModificationSimpleActionStatutHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
  fakeModificationDetailleActionStatutHistorique,
  fakeAjoutDetailleActionStatutHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionStatut,
} as Meta;

const ajoutDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeAjoutSimpleActionStatutHistorique,
};

export const AjoutDeStatutSimple = {
  args: ajoutDeStatutSimpleArgs,
};

const ajoutDeStatutDetailleArgs: THistoriqueItemProps = {
  item: fakeAjoutDetailleActionStatutHistorique,
};

export const AjoutDeStatutDetaille = {
  args: ajoutDeStatutDetailleArgs,
};

const modificationDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleActionStatutHistorique,
};

export const ModificationDeStatutSimple = {
  args: modificationDeStatutSimpleArgs,
};

const modificationDeStatutSimpleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleADetailleActionStatutHistorique,
};

export const ModificationDeStatutSimpleADetaille = {
  args: modificationDeStatutSimpleADetailleArgs,
};

const modificationDeStatutDetailleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationDetailleActionStatutHistorique,
};

export const ModificationDeStatutDetailleADetaille = {
  args: modificationDeStatutDetailleADetailleArgs,
};
