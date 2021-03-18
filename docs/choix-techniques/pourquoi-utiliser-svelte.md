# Qu'est-ce que Svelte et pourquoi l'utiliser ? 

[Svelte](https://svelte.dev) est un framework JavaScript qui offre un outillage pour 
coder et ranger efficacement des éléments (HTML) partageant un même style (CSS) et un 
même comportement (JavaScript), éléments que l'on appelle communément "composants".

- [Qu'est-ce qu'un composant ?](#quest-ce-quun-composant-)
- [Pourquoi en utiliser un pour LTE ?](#pourquoi-en-utiliser-un-pour-lte-)
- [Pourquoi utiliser Svelte ?](#pourquoi-utiliser-svelte-)

## Qu'est-ce qu'un composant ? 

Dans le monde du web, un composant est un ensemble de code, de design et d'UI qui 
rassemble les caractéristiques suivantes : 
- il est centré sur une partie spécifique de l'UI (User Interface).
- il encapsule du HTML, ainsi le CSS et le JavaScript qui lui sont associé.
- il peut être testé unitairement.
- il interagit avec d'autres composants via une API.

L'utilisation de composants permet la réutilisation et la composabilité d'une 
interface. Cela permet :
- de partager des termes et un langage communs entre les différents membres d'une 
  équipe pour décrire les éléments utilisés dans une interface,
- de travailler de manière séparée sur l'UI et sur l'UX,
- de tester efficacement des parties de l'UI en isolation,
- d'avoir une unique source de vérité pour l'UI.
  
## Pourquoi en utiliser un pour LTE ? 

Nous sommes en février 2021. Le projet commence à avoir de nombreuses parties de 
l'application qui nécessitent de gérer des interactions avec l'utilisateur et son 
navigateur. L'usage d'un framework de composants nous offre une syntaxe et une 
organisation de code très flexible pour avancer comme nous le souhaitons, sans pour 
autant avoir à réfléchir nous-mêmes à comment organiser les fichiers ou compiler nos 
assets.

Pour l'équipe, cela signifie que nous pouvons commencer à partager des termes communs 
pour désigner les différents éléments de notre application, maintenant qu'elle 
commence à s'étoffer.

Pour l'équipe de développement, cela sert surtout à se décharger de la résolution de 
différentes problématiques liées à la gestion des données et leur mise à jour visuelle 
dans l'application (bindings). 

## Pourquoi utiliser Svelte ?

[Svelte](https://svelte.dev) est un framework JavaScript sorti en 2016. Il se 
distingue des frameworks connus actuels car il permet aux personnes qui développent 
d'écrire un code déclaratif et piloté par l'UI sans pour autant faire payer le coût 
de cette syntaxe à l'utilisateur final dans son navigateur. Il transforme une syntaxe 
déclarative en code impératif au moment de la compilation et non en servant tout le 
code de son framework à l'utilisateur. À sa sortie, on pouvait avoir une différence de 
plus de 40Kb de JavaScript servi avec React (45Kb gzippé pour React+ReactDOM contre 3.
6Kb pour Svelte).

Le framework a une grande communauté de contributeurs et est financé par dons via 
[OpenCollective](https://opencollective.com/svelte). Ce qui semble assurer sa 
perennité à moyen terme. Le dépôt Git est sous licence MIT et permet donc de 
contribuer en fonction de nos besoins, voire faire un fork si nécesaire.

Sur le plan technique, la légèreté du code généré par Svelte correpond à notre philosophie
concernant la sobriété numérique. L'organisation du code proposée par la librairie avec le 
script JavaScript (comportemental), la CSS (design) et le HTML (contenu) au même endroit 
facilite énormément la lecture et la compréhension de l'UI.
