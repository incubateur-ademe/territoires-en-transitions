export type ExternalLinkProps = {
  href: string;
  text: string;
};

export const ExternalLink = ({ href, text }: ExternalLinkProps) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );
};
