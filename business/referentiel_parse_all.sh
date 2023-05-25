#!/bin/sh
pipenv run python referentiel_cli.py parse-preuves\
    --input-markdown-folder "../markdown/preuves"\
    --output-json-file "../content/preuves.json"

pipenv run python referentiel_cli.py parse-actions\
    --input-markdown-folder "../markdown/referentiels/cae"\
    --output-json-file "../content/cae.json"

pipenv run python referentiel_cli.py parse-actions\
    --input-markdown-folder "../markdown/referentiels/eci"\
    --output-json-file "../content/eci.json"

pipenv run python referentiel_cli.py parse-indicateurs\
    --input-markdown-folder "../markdown/indicateurs/**"\
    --output-json-file "../content/indicateurs.json"

pipenv run python referentiel_cli.py parse-personnalisations\
    --questions-markdown-folder "../markdown/questions"\
    --regles-markdown-folder "../markdown/personnalisations"\
    --output-json-file "../content/personnalisations.json"
