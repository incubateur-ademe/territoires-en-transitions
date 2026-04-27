import { Text } from '@react-pdf/renderer';
import classNames from 'classnames';
import { getFormattedNumber } from '../../fiche-action/external-helpers';
import { BadgeSize } from '../../ui-compat';
import { tw } from '../utils';
import { Badge } from './Badge';

type BadgeBudgetProps = {
  montant: number | undefined | null;
  unite?: 'HT' | 'ETP';
  size?: BadgeSize;
  className?: string;
};

export const BadgeBudget = ({
  montant,
  unite = 'HT',
  className,
  ...props
}: BadgeBudgetProps) => {
  return (
    <Badge
      title={
        !montant && montant !== 0 ? (
          'Non renseigné'
        ) : (
          <Text>
            {getFormattedNumber(montant)}{' '}
            {unite === 'HT' ? (
              <>
                € <Text style={tw('text-[0.5rem] leading-[0.6rem]')}>HT</Text>
              </>
            ) : (
              <>ETP</>
            )}
          </Text>
        )
      }
      variant="standard"
      className={classNames('bg-white', className)}
      {...props}
    />
  );
};
