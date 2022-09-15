const ScrollTopButton = () => {
  return (
    <button onClick={() => window.scrollTo(0, 0)}>
      <div className="flex items-center text-lg text-bf500 pb-1 border-b border-bf500">
        <div className="fr-fi-arrow-up-line scale-90 mt-0.5 mr-2" />
        <span>Haut de page</span>
      </div>
    </button>
  );
};

export default ScrollTopButton;
