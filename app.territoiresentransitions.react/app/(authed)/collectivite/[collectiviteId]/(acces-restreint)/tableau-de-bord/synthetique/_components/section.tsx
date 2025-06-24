import { ReactNode } from 'react';

import { Button, ButtonProps } from '@/ui';

type Props = {
  title: string;
  children: ReactNode;
  /** Liste de liens affichée en haut à droite de la section */
  links?: ButtonProps[];
};

const Section = ({ title, links, children }: Props) => {
  return (
    <div className="flex flex-col gap-8">
      {/** header */}
      <div className="flex items-center justify-between flex-wrap">
        <h5 className="mb-0">{title}</h5>
        <div className="flex flex-wrap gap-2">
          {links?.map((link, index) => (
            <Button key={index} {...link} variant="outlined" size="xs" />
          ))}
        </div>
      </div>
      {/** content */}
      {children}
    </div>
  );
};

export default Section;
