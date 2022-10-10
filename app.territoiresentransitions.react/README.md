# Installation
Ce projet a été démarré avec [Create React App](https://github.com/facebook/create-react-app).

Vous avez besoin de node installé, version >= 16.
Dans 'front', vous devez installer l'application avec la commande :

#### `npm install`
#### `cp .env.sample .env`
Vous pouvez modifier les variables d'environnement dans ce nouveau fichier `.env`
On peut ensuite lancer le script qui nous intéresse dans la liste ci-dessous.


## Scripts disponibles
``npm run dev`` : démarre l'appli en mode dev

``npm run test`` : lance les tests

``npm run build`` : construit les bundles de production


## Organisation du front
L'arborescence du front est la suivante :

- `core-logic` : c'est là que se fait la gestion de l'état de l'application. Il ne doit pas y avoir de `jsx`, 
  `css` ou `html` ici. Cette partie concentre la logique métier pure, l'orchestration du state. Les requêtes et les souscriptions se passent ici également. C'est la partie du front qui est testée.
 
- `css` : on trouve ici tailwindcss et des règles/petits overrides du dsfr propre à notre app.

- `generated/data` : Les données générées par l'ancienne archi (codegen) et vouées à être remplacées par des 
  appels à l'API.

- `generated/dataLayer` : Les types exportés par le Data Layer `/data_layer`.

- `types` : Les types et les interfaces partagées.

- `ui` : la bibliothèque de composants. On cherche à faire des composants indépendants de l'application. Il ne 
  doivent pas connaitre, ni faire référence à redux. On utilise beaucoup [material-ui](https://material-ui.com/). Les imports à material-ui doivent se faire uniquement dans le dossier `ui`. Cela permet de changer facilement de design, sans avoir à toucher directement au code de l'application.

- `utils` : on regroupe là les petites fonctions utilitaires qui peuvent servir un peu partout.

- `interface` : les interfaces typescript qui sont ici sont générées par le backend. C'est sur elle que l'on s'appuie pour garantir le contrat d'interface avec le backend.

- `app` : c'est là qu'est construite l'application react à proprement parlée. Elle va consommer ce qui est dans `core-logic` et dans `ui`.

- `server/zipUrls.js` : module intégré au serveur de ressources du front, permettant de télécharger une liste d'URLs passée dans le corps d'une requête POST émise par le front, et de renvoyer une archive zip des fichiers téléchargés. Ce module est intégré dans le serveur de développement (cf `setupProxy.js`) et dans celui de production (cf `server.js`).

### CSS
Les feuilles de style suivantes sont utilisées :

- `public/dsfr.css` le [dsfr](https://gouvfr.atlassian.net/wiki/spaces/DB/overview?homepageId=145359476) chargé à partir de index.html
- `src/css/tailwind.css` [tailwindcss](https://tailwindcss.com/) chargé depuis index.tsx 
- `src/css/app.css` quelques styles globaux chargés depuis index.tsx

Pour que la cohabitation entre tailwind et le dsfr se passe bien, il est recommandé de ne pas utiliser de classes 
tailwind sur des composants dsfr.
