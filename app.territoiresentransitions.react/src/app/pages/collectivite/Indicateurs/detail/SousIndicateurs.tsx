import IndicateursListe from '../lists/indicateurs-list';

type Props = {
  enfantsIds: number[];
  isReadonly: boolean;
};

const SousIndicateurs = ({ enfantsIds, isReadonly }: Props) => {
  if (!enfantsIds?.length) return null;

  return (
    <div className="bg-white p-10 border border-grey-3 rounded-xl">
      <IndicateursListe
        filtres={{ indicateurIds: enfantsIds }}
        sortSettings={{
          defaultSort: 'text',
        }}
        menuContainerClassname="!border-0 pb-0"
        isEditable={!isReadonly}
      />
    </div>
  );
};

export default SousIndicateurs;
