import {Meta} from '@storybook/nextjs-vite';

import HistoriqueItemActionStatut from './HistoriqueItemActionStatut';
import {HistoriqueItemProps} from '../types';
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

const ajoutDeStatutSimpleArgs: HistoriqueItemProps = {
  item: fakeAjoutSimpleActionStatutHistorique,
};

export const AjoutDeStatutSimple = {
  args: ajoutDeStatutSimpleArgs,
};

const ajoutDeStatutDetailleArgs: HistoriqueItemProps = {
  item: fakeAjoutDetailleActionStatutHistorique,
};

export const AjoutDeStatutDetaille = {
  args: ajoutDeStatutDetailleArgs,
};

const modificationDeStatutSimpleArgs: HistoriqueItemProps = {
  item: fakeModificationSimpleActionStatutHistorique,
};

export const ModificationDeStatutSimple = {
  args: modificationDeStatutSimpleArgs,
};

const modificationDeStatutSimpleADetailleArgs: HistoriqueItemProps = {
  item: fakeModificationSimpleADetailleActionStatutHistorique,
};

export const ModificationDeStatutSimpleADetaille = {
  args: modificationDeStatutSimpleADetailleArgs,
};

const modificationDeStatutDetailleADetailleArgs: HistoriqueItemProps = {
  item: fakeModificationDetailleActionStatutHistorique,
};

export const ModificationDeStatutDetailleADetaille = {
  args: modificationDeStatutDetailleADetailleArgs,
};
