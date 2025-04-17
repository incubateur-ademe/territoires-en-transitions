import { getFormattedNumber } from '@/app/utils/formatUtils';
import { FinanceurUpdate } from '@/domain/plans/fiches';
import { Badge } from '@/ui';

type FinanceursListeProps = {
  financeurs?: FinanceurUpdate[];
};

const FinanceursListe = ({ financeurs }: FinanceursListeProps) => {
  return (financeurs ?? []).map((f, index) => (
    <div key={`${f.financeurTag.nom}-${index}`} className="flex">
      <Badge
        title={f.financeurTag.nom}
        state="standard"
        uppercase={false}
        className="!rounded-r-none"
      />
      <Badge
        title={
          f.montantTtc ? (
            <span>
              {getFormattedNumber(f.montantTtc)} € <sup>HT</sup>
            </span>
          ) : (
            'Non renseigné'
          )
        }
        state="standard"
        light
        uppercase={false}
        className="!rounded-l-none"
      />
    </div>
  ));
};

export default FinanceursListe;
