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
            <div className="flex items-start gap-1">
              <div>{getFormattedNumber(f.montantTtc)} € </div>
              <div className="text-[0.5rem] leading-[0.6rem]">TTC</div>
            </div>
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
