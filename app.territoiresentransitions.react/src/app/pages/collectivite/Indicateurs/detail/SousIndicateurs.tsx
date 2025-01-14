import IndicateursListe from '../lists/indicateurs-list';

type Props = {
  enfantsIds: number[];
};

const SousIndicateurs = ({ enfantsIds }: Props) => {
  if (!enfantsIds?.length) return null;

  return (
    <IndicateursListe
      filtres={{ indicateurIds: enfantsIds }}
      sortSettings={{
        defaultSort: 'text',
      }}
      menuContainerClassname="!border-0 pb-0"
    />
  );
};

export default SousIndicateurs;
