const ScrollTopButton = ({className = ''}: {className?: string}) => {
  return (
    <div className={className}>
      <a
        className="underline_href fr-link fr-link--icon-left fr-icon-arrow-up-fill"
        href="/"
        onClick={evt => {
          evt.preventDefault();
          document
            .getElementsByClassName('fr-header')
            .item(0)
            ?.scrollIntoView({behavior: 'smooth'});
        }}
      >
        Haut de page
      </a>
    </div>
  );
};

export default ScrollTopButton;
