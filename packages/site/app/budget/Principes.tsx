const Principes = () => {
  return (
    <div className="bg-white md:rounded-[10px] py-8 md:py-12 px-6 md:px-10">
      <h2 className="text-primary-9 mb-10">Principes</h2>

      <p className="paragraphe-16 text-primary-11 mb-10">
        Nous suivons le manifeste beta.gouv dont nous rappelons les principes
        ici :
      </p>

      <div className="mb-10">
        <p className="text-primary-11 text-[16px] leading-[25px] font-bold">
          Les besoins des utilisateurs sont prioritaires sur les besoins de
          l’administration.
        </p>
      </div>
      <div className="mb-10">
        <p className="text-primary-11 text-[16px] leading-[25px] font-bold">
          Le mode de gestion de l’équipe repose sur la confiance.
        </p>
      </div>
      <div className="mb-10">
        <p className="text-primary-11 text-[16px] leading-[25px] font-bold">
          L’équipe adopte une approche itérative et d’amélioration en continu.
        </p>
      </div>
    </div>
  );
};

export default Principes;
