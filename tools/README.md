# Tools

- [Pré-requis](#pré-requis)
- [Pour quoi faire ?](#pour-quoi-faire-)
- [Comment on s'en sert ?](#comment-on-sen-sert-)

## Pré-requis
- Python >= 3.9.1
- [Poetry](https://python-poetry.org/docs/#installation)

## Pour quoi faire ?
Pour le moment cette partie du projet sert à avoir un outil de déploiement en ligne de commande.

On imagine ajouter ici d'autres outils.

## Comment on s'en sert ?
Pour se servir des scripts et de l'outil CLI il faut [installer poetry](https://python-poetry.org/docs/#installation)

Ensuite pour installer les dépendances:
```shell
poetry install
```

## L'outil de déploiement
Permet de déployer l'application de façon programmatique afin de permettre de deployer sur différents sous domaines avec une simple commande : `poetry run deploy --bucket staging`

`poetry run deploy --help`

```shell
Usage: deploy [OPTIONS]

Upload files into a sub domain bucket

Options:
-s, --subdomain TEXT            [default: sandbox]
-c, --client TEXT               [default: ../client/dist]
--install-completion [bash|zsh|fish|powershell|pwsh]
Install completion for the specified shell.
--show-completion [bash|zsh|fish|powershell|pwsh]
Show completion for the specified shell, to
copy it or customize the installation.

--help                          Show this message and exit.
```

#### Principales libraries utilisées
- Utilise [Typer](https://github.com/tiangolo/typer) tout comme codegen pour créer des CLI très simplement.
- Utilise [Boto3](https://aws.amazon.com/sdk-for-python) pour envoyer les contenus sur les buckets compatibles S3 de Scaleway.
