# Guide démarrage rapide: utilisation de l'api de Territoires en Transitions

## Authentification

L'authentification de l'Api s'appuie sur le standard [Oauth2 client credentials flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow). Des applications identifiées par un `client_id` et protégées par un `client_secret` sont déclarées. La première étape avant de pouvoir appeler l'api en elle même consiste à générer un token à partir de ce couple `client_id/client_secret` en utilisant le endpoint `https://api.territoiresentransitions.fr/api/v1/oauth/token`. Le token retourné doit être utilisé en `Bearer` pour les appels aux autres endpoints d'api. Il a une durée de validité de **6h**.

A noter que les applications sont aujourd'hui rattachées à des utilisateurs et donc **héritent de leurs permisions** (voir ci-dessous). Il est en revanche possible de restreindre uniquement à un sous-ensemble de ces permissions (ex: uniquement les endpoints de lecture/écriture des indicateurs). 

## Permissions

La plupart des données de la plateforme **sont disponibles en mode visite**, c'est à dire quelque soit les permissions de l'utilisateur. Il est par exemple possible de consulter les labellisation des collectivités. 

Certains endpoints peuvent cependant nécessiter des permissions supplémentaires:
- Les valeurs d'indicateur peuvent être consultées sauf si l'indicateur est défini comme étant confidentiel et dans ce cas la dernière valeur n'est pas consultable librement: l'utilisateur doit disposer **d'un droit explicite en lecture** sur la collectivité en question.
- A fortiori, il est nécessaire de disposer **d'un droit d'écriture** sur la collectivité pour créer ou mettre à jour des valeurs d'indicateur.

Il est possible de lister les permissions associés à une clé d'api en utilisant le endpoint `/api/v1/utilisateur`.

## Cas d'usage

### Consultation de la labellisation d'une ou plusieurs collectivités

La labellisation (courante et historique) d'une ou plusieurs collectivités peut être consultée en utilisant le endpoint `/api/v1/collectivites/labellisations`. La réponse est paginée. Il est possible chercher une collectivité par son nom, son siren ou le code de la commune.

### Consultation des valeurs d'indicateur d'une collectivité

- Commencez pour cela par identifier la collectivité en utilisant le endpoint `/api/v1/collectivites` en cherchant éventuellement la collectivité par son nom, son siren ou le code de la commune.
- Identifiez également l'indicateur souhaité dans la liste fournie par le endpoint `/api/v1/indicateur-definitions`. A noter qu'il est possible d'inclure dans la réponse les indicateurs personnalisés d'une collectivité en fournissant un `collectiviteId`.
- Enfin, utilisez le endpoint `/api/v1/indicateur-valeurs` en donnant l'identifiant de la collectivité ainsi que le(s) identifiant(s) d'indicateurs et en filtrant éventuellement par source et/ou par date pour obtenir les valeurs d'indicateur.