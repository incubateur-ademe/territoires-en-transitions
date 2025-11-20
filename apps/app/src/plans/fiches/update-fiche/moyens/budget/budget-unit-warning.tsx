import { Alert } from '@tet/ui';

export const BudgetUnitWarning = () => {
  return (
    <Alert
      state="warning"
      title="Ces champs historiquement en TTC sont passés en HT, veillez à vérifier vos valeurs et à les modifier le cas échéant. N’hésitez pas à contacter le support si vous avez besoin d’aide pour faire les conversions."
      rounded
      withBorder
    />
  );
};
