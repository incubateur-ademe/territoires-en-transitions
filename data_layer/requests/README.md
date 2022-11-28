# Tests http

Ce dossier contient des tests qui seront remplacés par les [tests d'intégrations en TypeScript](../../api_tests/README.md) pour la partie de l'API à usage interne. 
On ne devrait plus s'en servir que pour des scénarios d'usage externe.

Ces tests sont des requêtes pour le [client http IntelliJ](https://www.jetbrains.com/help/idea/testing-restful-web-services.html)
afin de tester les endpoints en cours de développement rapidement. On peut aussi utiliser [httpYac](https://httpyac.github.io) pour le développement avec VSCode.

Ils tournent en CI grâce à une [CLI](https://github.com/restcli/restcli).
                            
## Utilisation

Renommer le `http-client.sample.json` en `http-client.env.json` et ajouter la clé d'API anon de kong.
