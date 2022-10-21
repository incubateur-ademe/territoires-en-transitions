#!/bin/sh
python referentiel_cli.py parse-preuves\
    --input-markdown-folder "../markdown/preuves"\
    --output-json-file "../data_layer/content/preuves.json"

python referentiel_cli.py parse-preuves\
    --input-markdown-folder "../markdown/preuves"\
    --output-json-file "../data_layer/content/preuves.json"

python referentiel_cli.py parse-actions\
    --input-markdown-folder "../markdown/referentiels/cae"\
    --output-json-file "../data_layer/content/cae.json"

python referentiel_cli.py parse-actions\
    --input-markdown-folder "../markdown/referentiels/eci"\
    --output-json-file "../data_layer/content/eci.json"

python referentiel_cli.py parse-indicateurs\
    --input-markdown-folder "../markdown/indicateurs/**"\
    --output-json-file "../data_layer/content/indicateurs.json"

python referentiel_cli.py parse-personnalisations\
    --questions-markdown-folder "../markdown/questions"\
    --regles-markdown-folder "../markdown/personnalisations"\
    --output-json-file "../data_layer/content/personnalisations.json"
