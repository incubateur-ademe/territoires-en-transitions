import classNames from 'classnames';
import { Text } from '@react-pdf/renderer';
import { getFormattedNumber } from '@tet/app/pages/collectivite/PlansActions/FicheAction/utils';
import { Badge } from '../../components';
import { tw } from '../../utils';

type BadgeBudgetProps = {
  montantTtc: number | undefined | null;
  size?: 'sm' | 'md';
  className?: string;
};

export const BadgeBudget = ({
  montantTtc,
  className,
  ...props
}: BadgeBudgetProps) => {
  return (
    <Badge
      title={
        montantTtc ? (
          <Text>
            {getFormattedNumber(montantTtc)} €{' '}
            <Text style={tw('text-[0.5rem] leading-[0.6rem]')}>TTC</Text>
          </Text>
        ) : (
          'Non renseigné'
        )
      }
      state="standard"
      className={classNames('bg-white', className)}
      {...props}
    />
  );
};
