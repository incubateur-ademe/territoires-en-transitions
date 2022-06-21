import React, {useState} from 'react';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {Chevron} from 'ui/shared/Chevron';
import {AnyIndicateurRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {RenderMarkdownText} from 'ui/shared/RenderMarkdownText';
import {Spacer} from 'ui/shared/Spacer';

export const AnyIndicateurCard = <T extends string | number>({
  children,
  headerTitle,
  indicateurId,
  indicateurResultatRepo,
  description,
}: {
  headerTitle: React.ReactElement;
  children: React.ReactElement;
  indicateurId: string | number;
  description: string;
  indicateurResultatRepo: AnyIndicateurRepository<T>;
}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-2  px-5 py-4 mb-5 ">
      <section className="flex flex-col">
        <header className="w-full cursor-pointer mb-5">
          <div
            onClick={e => {
              e.preventDefault();
              setOpened(!opened);
            }}
            className="flex items-center justify-between font-bold text-lg"
          >
            {headerTitle}
            <Chevron direction={opened ? 'down' : 'left'} />
          </div>
          <RenderMarkdownText text={description} />
          <Spacer />
          <div className="text-lg ml-7 mb-2">Résultats</div>
          <AnyIndicateurValues
            repo={indicateurResultatRepo}
            indicateurId={indicateurId}
            borderColor="blue"
          />
        </header>
        {opened && children}
      </section>
    </div>
  );
};
