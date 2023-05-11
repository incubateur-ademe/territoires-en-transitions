import {TMembreFonction} from 'types/alias';
import {SelectOption} from 'ui/shared/form/formik/FormikSelect';

export const collectiviteFonctionOptions: SelectOption<TMembreFonction>[] = [
  {
    value: 'conseiller',
    label: "Bureau d'études",
  },
  {
    value: 'politique',
    label: 'Équipe politique',
  },
  {
    value: 'technique',
    label: 'Équipe technique',
  },
  {
    value: 'partenaire',
    label: 'Partenaire',
  },
  {
    value: 'referent',
    label: 'Référent·e',
  },
];
