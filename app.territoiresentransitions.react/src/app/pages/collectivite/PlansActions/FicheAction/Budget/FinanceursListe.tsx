import {Badge} from '@tet/ui';
import {Financeur} from '../data/types';
import {getFormattedNumber} from '../utils';

type FinanceursListeProps = {
  financeurs?: Financeur[];
};

const FinanceursListe = ({financeurs}: FinanceursListeProps) => {
  return (financeurs ?? []).map((f, index) => (
    <div key={`${f.financeur_tag.nom}-${index}`} className="flex">
      <Badge
        title={f.financeur_tag.nom}
        state="standard"
        uppercase={false}
        className="!rounded-r-none"
      />
      <Badge
        title={
          f.montant_ttc ? (
            <div className="flex items-start gap-1">
              <div>{getFormattedNumber(f.montant_ttc)} € </div>
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
