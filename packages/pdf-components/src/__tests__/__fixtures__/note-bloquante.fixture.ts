// Note réelle (anonymisée) qui faisait boucler le rendu PDF à l'infini en prod
// le 2026-10-20 (fiche 66062) : bloc wrap={false} + paragraphes « &nbsp; ».
// Le blocage dépend de la mise en page exacte : ne pas reformuler ce texte.
const P = (s: string) =>
  `<p class="!text-base !text-grey-8 font-[Marianne]">${s}</p>`;
export const noteBloquante = [
  P('&nbsp;'),
  P(
    '<strong>4.2.A.3 = Fonds de concours aux investissements communaux concourant à la stratégie climat</strong>'
  ),
  '<p>&nbsp;</p>',
  P(
    '<strong>Une enveloppe de 1.5 Millions d’euros sur trois ans (2025-2027) dont 952 K€ en faveur des investissements communaux concourant à la stratégie climat</strong>'
  ),
  P('&nbsp;'),
  P(
    'Afin d’accompagner le développement de ses communes, la communauté a choisi de participer au financement de leurs investissements. Elle a décidé, dans cet objectif, d’allouer aux communes membres une enveloppe globale de 1,5 millions d’euros de fonds de concours pour trois ans, soit la période 2025-2027.'
  ),
  P('&nbsp;'),
  P('<u>Éligibilité des projets :</u>'),
  P(
    'Une distinction a été faite entre les communes de plus ou moins 1 500 habitants +/- 10% afin de tenir compte des contraintes budgétaires des petites communes :'
  ),
  P(
    '\u0097 Communes de moins de 1 500 habitants avec +/- 10% : tous les projets d’investissement sont finançables,'
  ),
  P(
    '\u0097 Communes de plus de 1 500 habitants avec +/- 10% : sont éligibles les projets d’investissement concourant aux objectifs généraux de la stratégie climat définie par la communauté. Aussi, les projets d’investissement doivent contribuer directement ou indirectement à l’un des objectifs suivants :'
  ),
  P('o La réduction des émissions de gaz à effet de serre (GES)'),
  P('o La réduction des consommations d’énergie'),
  P('o La séquestration carbone'),
  P('o La production d’énergies renouvelables ou de récupération'),
  P('o La réduction des émissions de polluants atmosphériques'),
  P('o L’adaptation du territoire aux effets du changement climatique'),
  P('o L’amélioration de la qualité de l’air.'),
  P('&nbsp;'),
  P(
    'L’enveloppe de 1.5 millions a été inscrite en 2025 en section d’investissement au titre des fonds de concours aux communes. <strong>952 K€ concernent les communes soumises à l’obligation de concourir à la stratégie climat.</strong>'
  ),
  P('&nbsp;'),
  P(
    'En 2025, 1 118 K€ ont été attribués à 26 communes pour soutenir leurs projets, soit 75% de l’enveloppe totale. Sur ces 1 118 k€ le comité technique de suivi a constaté que 872 K€ des fonds alloués concourent à la stratégie climat. Dont deux communes de moins de 1 500 habitants, quoique non soumises à cette obligation, ont présenté des projets qui y contribuent (pour 42 K€).'
  ),
  P('&nbsp;'),
  P(
    'Au CFU 2025, sur les 1 118 K€ affectés, 275 K€ ont été effectivement versés à cinq communes. 236 K€ de montants versés concernent des dossiers stratégie climat'
  ),
  P(
    'Le solde sera versé aux autres communes à réception des bilans financiers.'
  ),
].join('');
