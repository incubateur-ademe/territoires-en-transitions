# Quelques questions pour commencer

On peut trouver ici quelques questions concernant le fonctionnement de l'équipe
tech au jour le jour. Les éléments peuvent être amenés à changer au fur et à
mesure que l'équipe évolue.

- [Quel est notre positionnement par rapport au produit ?](#quel-est-notre-positionnement-par-rapport-au-produit-)
- [Quel est notre rapport avec le métier ?](#quel-est-notre-rapport-avec-le-métier-)
- [Comment écrire de la documentation ?](#comment-écrire-de-la-documentation-)
- [Comment faire de la revue de code ?](#comment-faire-de-la-revue-de-code-)
  - [Quelle est l'intention derrière la revue de code ?](#quelle-est-lintention-derrière-la-revue-de-code-)
  - [Comment se passe une revue de code ?](#comment-se-passe-une-revue-de-code-)
  - [Quand commencer la revue de code ?](#quand-commencer-la-revue-de-code-)
  - [Qui arbitre pendant la revue de code ?](#qui-arbitre-pendant-la-revue-de-code--à-valider-ensemble)
  - [Dans quel état d'esprit fait-on de la revue de code ?](#dans-quel-état-desprit-fait-on-de-la-revue-de-code-)
  - [Ressources](#ressources)

## Quel est notre positionnement par rapport au produit ?

Les discussions avec le produit peuvent s'articuler sur plusieurs axes :
- **la réflexion produit** : on discute du produit et on essaie de
  comprendre les problèmes que l'on tente de résoudre pour les personnes
  utilisatrices.
- **la priorisation** : on essaie de parcourir les cas d'usage pour juger de ce qui est facile/difficile à coder, du coût en temps/énergie et des partis-pris et pour lister  les contraintes et les possibilités d'implémentation.
- **le développement** : on tente ici de valider un cas d'usage pour le coder. Notre attention se porte donc sur toutes les informations qui pourraient nous manquer et sur valider ce qui est possible de coder avec ou sans.

Ces axes n'ont pas la même temporalité et peuvent être interrogé en même temps ou de manière plus spécifique.

## Quel est notre rapport avec le métier ?

### Les usages métiers

Avec les intrapreneurs, il est important de discuter de tout ce qui concerne le métier.
Avoir des échanges sur le fonctionnement du référentiel, sur les habitudes des chargés de projet sur la transition écologique ou encore sur les enjeux politiques de notre projet nous permet d'implémenter correctement les user stories et de proposer d'autres solutions en plus de celles sur lesquelles on travaille.

### Le vocabulaire

Entre le vocabulaire tech/produit/méthodologie agile, celui de beta.gouv et
celui de l'ADEME, on appprend ensemble beaucoup nouveaux mots, sigles ou concepts.
Autant que possible, on pose des questions quand on ne sait pas ou qu'on ne comprend pas
et on documente les lexiques pour faciliter la communication entre nous.

### Le budget

Les questions de financement du projet nous permettent de nous positionner sur
les propositions techniques à faire lorsqu'on travaille sur une fonctionnalité.
C'est un éclairage supplémentaire pour qu'on reste aligné sur une vision
similaire à la vision des intrapreneurs. On garde donc cet aspect en tête même
si on n'est pas directement impliqué sur le sujet.

## Comment écrire de la documentation ?

Il existe différents types de documentation. Il est aussi important d'écrire de
la documentation que de ne pas en écrire une qui soit obsolète rapidement.

On tente donc de suivre au maximum les préconisations sur les 4 types de
documentation : https://documentation.divio.com/.

Dans les sujets à documenter, on peut lister :
- explication des choix techniques : cela permet de garder un historique et le contexte
  des choix faits sur le projet,
- un how-to pour les accès aux différents outils tech (interface d'hébergement, accès ssh, etc),
- des références pour le code (API, nomenclature, etc).

## Comment faire de la revue de code ?

### Quelle est l'intention derrière la revue de code ?
- la collaboration : on partage la responsabilité des erreurs, on échange avec les autres.
- la qualité : on assure un code plus robuste avec plusieurs lectures.
- l'apprentissage : on pose des questions sur les implémentations qu'on ne comprend pas, on découvre des patterns auquels on n'aurait pas pensé.

### Comment se passe une revue de code ?
1. La personne qui veut merger son code créé une PR
2. Lorsque la PR est prête à être relue, on assigne une personne pour la revue
   de code dessus.
3. La personne qui fait la revue fait des commentaires sur la PR pour donner son
   avis, poser des questions ou proposer des modifications.
4. Des échanges se font via commentaires sur la PR et le code peut être amené à changer.
5. La PR est validée par la personne qui fait la revue.
6. La PR peut être mergée par la personne qui produit le code.

### Quand commencer la revue de code ?
On choisit de faire de la revue de code quasiment systématiquement sur ce projet dès qu'il y a du code à merger sur la branche principale. Il y aura des exceptions, c'est certain. On reste flexible sur le sujet.

Pour une première fois sur le projet, le meilleur moyen de commencer est de faire une session à deux dès qu'il y a du code à merger. Faire du pair-review dissipe les malentendus qu'on peut avoir à l'écrit et rassure pour une première approche de la revue de code.

### Qui arbitre pendant la revue de code ?
La personne en charge de la PR est **responsable de sa PR**. Cela signifie qu'elle peut choisir de faire ou non les changements proposés dans les commentaires.

Concrètement, on peut se retrouver dans ces cas de figure quand on a créé une PR :
- on est d'accord avec le commentaire et on change notre code
- on est d'accord avec le commentaire mais on pense que c'est mieux de le faire plus tard (contrainte de temps, d'énergie, etc)
- on n'est pas d'accord et ce qu'on propose est validé par les autres.
- on n'est pas d'accord et ce qu'on propose n'est pas validé par les autres. C'est le moment de sortir de la revue de code et lancer une véritable discussion.

### Dans quel état d'esprit fait-on de la revue de code ?
La revue de code n'est pas exempte de biais. Elle est simplement un outil que l'on doit adapter à l'équipe.

On peut lister quelques points d'attention ici :
- Pour la personne qui fait la revue : rester empathique et se mettre à la place de la  personne qui a codé. On ne code pas de la même manière, dans les mêmes circonstances, avec les mêmes privilèges et outils. C'est primordial de rester ouvert dans ses propositions et flexible dans ses commentaires.
- Pour la personne dont le code est commenté : garder la responsabilité sur le code à changer. Il peut être facile de faire tous les retours sans réfléchir ou à l'inverse, refuser tous les changements. Dans tous les cas, le choix est de votre côté et vous savez pourquoi vous faites ou non des changements sur votre code. C'est important d'être content-e de ce qu'on produit.
-  Pour tout le monde : se demander à quel moment on doit sortir de la revue de code pour passer à une discussion à l'oral en face à face ou un point à plusieurs pour trancher sur un arbitrage à faire. Trop de commentaires peut amener à de la frustration, de la démotivation et du désengagement.

### Ressources
- https://gb-prod.fr/2016/12/01/la-revue-de-code-bienveillante.html
- https://www.paris-web.fr/2019/conferences/autocritique-de-la-revue-de-code-bienveillante.php
