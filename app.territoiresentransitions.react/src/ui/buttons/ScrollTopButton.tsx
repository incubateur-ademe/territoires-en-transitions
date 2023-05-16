import AnchorAsButton from './AnchorAsButton';

const ScrollTopButton = ({className = ''}: {className?: string}) => {
  return (
    <div className={className}>
      <AnchorAsButton
        className="underline_href fr-link fr-link--icon-left fr-icon-arrow-up-fill"
        onClick={() =>
          document
            .getElementsByClassName('fr-header')
            .item(0)
            ?.scrollIntoView({behavior: 'smooth'})
        }
      >
        Haut de page
      </AnchorAsButton>
    </div>
  );
};

export default ScrollTopButton;
