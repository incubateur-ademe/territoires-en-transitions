import { Meta} from '@storybook/react';

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

export const AjoutDeStatutSimple = {
  args: ajoutDeStatutSimpleArgs,
};

const ajoutDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeAjoutSimpleActionStatutHistorique,
};

export const AjoutDeStatutDetaille = {
  args: ajoutDeStatutDetailleArgs,
};

const ajoutDeStatutDetailleArgs: THistoriqueItemProps = {
  item: fakeAjoutDetailleActionStatutHistorique,
};

export const ModificationDeStatutSimple = {
  args: modificationDeStatutSimpleArgs,
};

const modificationDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleActionStatutHistorique,
};

export const ModificationDeStatutSimpleADetaille = {
  args: modificationDeStatutSimpleADetailleArgs,
};

const modificationDeStatutSimpleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleADetailleActionStatutHistorique,
};

export const ModificationDeStatutDetailleADetaille = {
  args: modificationDeStatutDetailleADetailleArgs,
};

const modificationDeStatutDetailleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationDetailleActionStatutHistorique,
};
