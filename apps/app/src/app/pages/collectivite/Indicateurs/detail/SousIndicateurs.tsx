import { useIndicateursListParams } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import IndicateursListe from '../lists/indicateurs-list';

type Props = {
  enfantsIds: number[];
  isReadonly: boolean;
};

const SousIndicateurs = ({ enfantsIds, isReadonly }: Props) => {
  const { searchParams, setSearchParams } = useIndicateursListParams(
    { indicateurIds: enfantsIds },
    { sortBy: 'titre' }
  );

  if (!enfantsIds?.length) return null;

  return (
    <div className="bg-white p-10 border border-grey-3 rounded-xl">
      <IndicateursListe
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        isEditable={!isReadonly}
        menuContainerClassname="!border-0 !pb-0"
      />
    </div>
  );
};

export default SousIndicateurs;
