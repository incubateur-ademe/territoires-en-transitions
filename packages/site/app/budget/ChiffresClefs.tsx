const ChiffresClefs = () => {
  return (
    <div className="grid grid-cols-2 md:gap-10">
      <div className="bg-grey-1 md:rounded-[10px] py-8 px-6 flex flex-col justify-center">
        <span className="text-primary-7 text-[48px] leading-[32px] font-bold">
          729
        </span>
        <p className="text-primary-10 text-[20px] leading-[32px] font-bold mt-2 mb-0">
          Collectivités activées
        </p>
        <a
          href="/stats"
          className="text-primary-5 text-[10px] font-bold w-fit"
          target="_blank"
          rel="noreferrer noopener"
        >
          Toutes nos statistiques
        </a>
      </div>

      <div className="bg-grey-1 md:rounded-[10px] py-9 px-8 flex flex-col justify-center">
        <span className="text-primary-7 text-[48px] leading-[32px] font-bold">
          1233
        </span>
        <p className="text-primary-10 text-[20px] leading-[32px] font-bold mt-2 mb-0">
          Utilisateurs
        </p>
      </div>
    </div>
  );
};

export default ChiffresClefs;
