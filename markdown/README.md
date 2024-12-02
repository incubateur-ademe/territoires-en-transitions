## Markdowns to JSONs

```shell
earthly +business-parse
```

→ Va générer les fichiers JSON dans le dossier `data_layer/content/` à partir des markdowns présents dans le dossier `markdowns/`.

## Mise à jour en preprod / prod

```shell
./load_json_content.sh
```

→ Va uploader les JSON pour referentiels, preuves, personnalisations, et indicateurs

```shell
./load_json_indicateurs.sh
```

→ Va uploader uniquement le JSON pour les indicateurs
