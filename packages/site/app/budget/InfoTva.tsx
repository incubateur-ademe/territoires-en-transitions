/* eslint-disable react/no-unescaped-entities */
const InfoTva = () => {
  return (
    <div className="fr-notice fr-notice--info bg-info-2 p-6 mt-10 rounded-[10px]">
      <div className="fr-container">
        <div className="fr-notice__body text-info-1">
          <p className="fr-notice__title text-info-1 text-[16px]">
            À propos de la TVA
          </p>
          <p className="text-info-1 text-[14px] leading-[24px] font-[500] mb-0">
            Contrairement aux entreprises du secteur privé, les administrations
            ne peuvent pas récupérer la TVA supportée sur leurs achats dans le
            cadre de leur activité. Le montant TTC inclut la TVA au taux de 20%.
            La TVA est collectée et reversée à l'État et diminue donc le montant
            du budget utilisable sur le projet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoTva;
