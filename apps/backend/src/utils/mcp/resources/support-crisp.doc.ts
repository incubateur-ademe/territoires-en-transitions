// Ressource MCP `tet://docs/support-crisp` : lire les conversations du support
// (Crisp) avec get_support_stats et sample_support_conversations.

export const SUPPORT_CRISP_DOC = `# Support (Crisp) : segments et temps passé

Les demandes des usagers arrivent dans Crisp. Le support classe chaque conversation avec des **segments**, saisis à la main.

## Taxonomie des segments (depuis le 13/05/2026)

Forme : \`<type>_<sujet>[_<précision>]\`, par exemple \`besoin_guidage_referentiel_cr\` ou \`bug_indicateur\`.

| Type | Sens |
| --- | --- |
| \`besoin_guidage\` | L'usager ne sait pas faire : explication, accompagnement |
| \`bug\` | Dysfonctionnement de la plateforme |
| \`amelioration\` | Suggestion ou manque fonctionnel |
| \`metier\` | Question de fond sur le programme, le référentiel, la réglementation |
| \`support_obligatoire\` | Action que seul le support peut faire (rattachement, import de plan, création de compte…) |
| \`autre\` | Hors périmètre, redirection ADEME, remerciement, activation… |

Sujets fréquents : \`referentiel\` (suffixe \`_cr\` pour le référentiel CR, depuis le 11/08/2026), \`plans_actions\`, \`indicateur\`, \`audit_labellisation\`, \`rejoindre_collectivite\`, \`import_plan\`, \`rattachement\`, \`connexion\`, \`pcaet\`, \`snbc\`, \`personnalisation_referentiel\`.

Segments de **parcours**, posés par l'assistant de Crisp et non par le classement : \`assistant accepté\` (le bot a pris la conversation), \`support demandé\` (l'usager a demandé un humain), \`reprise humaine\`, \`workflow terminé\`.

## Pièges

- Avant le 13/05/2026, une autre taxonomie était en place (\`connexion-acces\`, \`plan-action-tdb\`, \`edl-cae\`, \`bug\`, \`amélioration\`…) : les volumes par type ne se comparent pas de part et d'autre de cette date.
- Un sujet précis n'existe que depuis qu'on l'utilise : avant, ses demandes sont classées sous un segment plus large (le CR sous \`*_referentiel\` avant le 11/08/2026). L'outil le signale dans \`avertissements\`.
- Accents et variantes de saisie (\`référentiel\` / \`referentiel\`) sont normalisés par l'outil.
- Une conversation peut porter plusieurs segments, donc plusieurs types : la somme de \`parType\` peut dépasser le nombre de conversations.
- Des conversations n'ont aucun segment (\`non_classe\`).

## Temps passé

Crisp n'enregistre aucune durée de traitement. L'outil l'**estime** à partir des messages et notes écrits par un opérateur humain (bots et plugins exclus) : des messages espacés de moins de 20 minutes forment une intervention, qui compte sa durée plus 3 minutes. C'est un ordre de grandeur, à présenter comme tel. Au-delà de 150 conversations, l'estimation porte sur un échantillon réparti sur la période puis est extrapolée.
`;
