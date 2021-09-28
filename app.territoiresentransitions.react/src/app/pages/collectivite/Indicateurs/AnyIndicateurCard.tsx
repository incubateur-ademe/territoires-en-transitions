import React, {useState} from 'react';
import {AnyIndicateurValueStorable} from 'storables';

import {HybridStore} from 'core-logic/api/hybridStore';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {Chevron} from 'ui/shared/Chevron';
import {Editable} from 'ui/shared';

export const AnyIndicateurCard = ({
  children,
  headerTitle,
  indicateurUid,
  indicateurResultatStore,
}: {
  headerTitle: React.ReactElement;
  children: React.ReactElement;
  indicateurUid: string;
  indicateurResultatStore: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-2  px-5 py-4 bg-beige mb-5 ">
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

          <div className="text-lg ml-7 mb-2">Résultats</div>
          <AnyIndicateurValues
            store={indicateurResultatStore}
            indicateurUid={indicateurUid}
            borderColor="blue"
          />
        </header>
        {opened && children}
      </section>
    </div>
  );
};
