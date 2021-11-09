

# Data-Layer

Le Data-Layer est responsable des lectures/écritures en base, c'est à dire de: 
  - stocker des données
      - provenant du business (referentiel, scores calculés...)
      - provenant du client (toutes valeurs saisies dans l'application)
  - notifier d'un changement en base 
      - au business (ex : nouveau statut d'une action, qui déclenchera le moteur de notation pour mettre à jour les scores)
      - au client (ex : un nouveau score a été calculé, donc les jauges doivent être mises à jour dynaamiquement)
  - fournir au client des vues prêtes à consommer

## Organisation du dossier
TODO ! 
## Mode d'emploi 
### Dev / tests avec docker

Aller dans le dossier `./test_only_docker` et exécuter : 

```
 docker-compose up --build 
```

### Générer les types pour le Business et le Client 
TODO ! 
### Production
TODO ! 

### Lancer les tests
TODO ! 

### Déployer 
TODO ! 


<!-- ## Type generation
```bash
npx @openapitools/openapi-generator-cli generate -i https://dmsgonehoayxxzswrwhc.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTI2MDQ1MSwiZXhwIjoxOTUwODM2NDUxfQ.IByfUKbPzNXWifvU3o23fmigjVXbhNWgarXVBNHrVZ0 -g python-fastapi -o types/
```
the models dir from the resulting command have be moved to generated_models -->
