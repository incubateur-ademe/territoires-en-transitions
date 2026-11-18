import { useIndicateursListParams } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import IndicateursListe from '../../../lists/indicateurs-list';

type Props = {
  enfantsIds: number[];
  isReadonly: boolean;
};

export const IndicateurSousIndicateurs = ({
  enfantsIds,
  isReadonly,
}: Props) => {
  const { searchParams, setSearchParams } = useIndicateursListParams(
    { indicateurIds: enfantsIds },
    { sortBy: 'titre' }
  );

  return (
    <div className="bg-white p-10 border border-grey-3 rounded-xl">
      <IndicateursListe
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        isEditable={!isReadonly}
        isEmbedded
      />
    </div>
  );
};
