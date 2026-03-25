import classNames from 'classnames';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { JSX, useState } from 'react';

import { referentielToName } from '@/app/app/labels';
import { ReferentielId } from '@tet/domain/referentiels';
import { Badge, Button, Icon, Spacer } from '@tet/ui';
import { HistoriqueType, THistoriqueItem } from './types';

export type HistoriqueDescription = {
  titre: string;
  description: string;
};

type Props = {
  historique: THistoriqueItem;
  // nom de la modification. ex: 'Action: statut modifié'
  nom: string;
  // tableau contenant par exemple l'action et la tache pour une modification de statut
  descriptions: HistoriqueDescription[];
  // icon affiché à côté du nom de la modification
  icon?: string;
  // le nouvel état et/ou le précédent en fonction du type d'historique
  detail?: JSX.Element;
  // à utiliser pour voir la page où se trouve la modification
  pageLink?: string;
};

// le nom du référentiel concerné sera affiché pour ces types de modifications
const SHOW_REFERENTIEL: HistoriqueType[] = [
  'action_statut',
  'action_precision',
  'preuve',
];

const Modification = ({
  historique,
  icon = 'information-fill',
  nom,
  descriptions,
  detail,
  pageLink,
}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const searchParams = useSearchParams();
  const { modified_at, modified_by_nom, type, action_id } = historique;
  const referentielId =
    SHOW_REFERENTIEL.includes(type) &&
    (action_id?.substring(0, 3) as ReferentielId);
  const referentielNom = referentielId && referentielToName[referentielId];
  const modifiedAt = new Date(modified_at);

  const pageLinkWithPanel = (() => {
    if (!pageLink) return undefined;
    const panel = searchParams.get('panel');
    if (!panel) return pageLink;
    const [pathname, hash] = pageLink.split('#');
    return { pathname, query: { panel }, hash };
  })();

  return (
    <div data-test="item">
      {/* DATE */}
      <Badge
        variant="standard"
        type="outlined"
        size="xs"
        title={format(modifiedAt, 'dd MMMM yyyy', { locale: fr })}
      />
      <Spacer height={1} />
      {/* MAIN */}
      <div className="">
        {/* ICON */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline justify-start gap-2">
            <Icon size="lg" icon={icon} className="text-primary-9" />
            <p className="mb-2 font-bold text-primary-9">{nom}</p>
          </div>

          {!!pageLinkWithPanel && (
            <Button
              icon="arrow-right-line"
              size="xs"
              iconPosition="right"
              variant="underlined"
              className="text-primary-9 text-sm border-b-transparent"
              href={pageLinkWithPanel}
            >
              {`Voir l'action`}
            </Button>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-col grow overflow-hidden">
          {/* DESCRIPTION */}
          <div className="mb-4" data-test="desc">
            <p className="mb-2 text-sm">
              <span className="text-gray-500">Par : </span>
              {modified_by_nom}
            </p>
            {referentielNom ? (
              <p className="mb-2 text-sm">
                <span className="text-gray-500">Référentiel : </span>
                {referentielNom}
              </p>
            ) : null}
            {descriptions.map((desc) => (
              <p key={desc.titre} className="mb-2 last:mb-0 text-sm">
                <span className="text-gray-500">{desc.titre} : </span>
                {desc.description}
              </p>
            ))}
          </div>
          {/* DETAILS */}
          {detail && (
            <div
              className="mb-4 border-t border-b border-grey-3 text-sm"
              data-test={`detail-${isDetailsOpen ? 'on' : 'off'}`}
            >
              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex items-center w-full py-4 px-2"
              >
                <div className="font-bold text-primary-9">
                  {isDetailsOpen ? 'Masquer le détail' : 'Afficher le détail'}
                </div>
                <Icon
                  size="lg"
                  icon="arrow-down-s-line"
                  className={classNames('ml-auto duration-100', {
                    'rotate-180': isDetailsOpen,
                  })}
                />
              </button>
              {isDetailsOpen && (
                <div className="max-w-full p-2 mb-4">{detail}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modification;
