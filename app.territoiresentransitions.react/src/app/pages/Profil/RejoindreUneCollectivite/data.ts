import {MembreFonction} from 'generated/dataLayer/membres';
import {SelectOption} from 'ui/shared/form/formik/FormikSelect';

export const collectiviteFonctionOptions: SelectOption<MembreFonction>[] = [
  {
    value: 'conseiller',
    label: 'Conseiller·e',
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
