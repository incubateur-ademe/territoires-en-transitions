import {indicateurs} from 'core-logic/commands/indicateurs';
import {referentiels} from 'core-logic/commands/referentiels';
import {epcis} from 'core-logic/commands/epcis';
import {plans} from 'core-logic/commands/plans';

export const commands = {
  indicateurCommands: indicateurs,
  referentielCommands: referentiels,
  epcisCommands: epcis,
  plansCommands: plans,
};
