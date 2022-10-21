from business.referentiel.cli import cli

if __name__ == "__main__":
    """
    Expose la CLI qui sert à convertir les markdowns en JSON.
    
    Exemples:
    ---------
    
    referentiel_cli.py parse-preuves 
        --input-markdown-folder "../markdown/preuves" 
        --output-json-file "../data_layer/content/preuves.json"
        
    referentiel_cli.py parse-actions 
        --input-markdown-folder "../markdown/referentiels/cae" 
        --output-json-file "../data_layer/content/cae.json"
        
    referentiel_cli.py parse-indicateurs 
        --input-markdown-folder "../markdown/indicateurs/**" 
        --output-json-file "../data_layer/content/indicateurs.json"

    referentiel_cli.py parse-personnalisations 
        --questions-markdown-folder "../markdown/questions"  
        --regles-markdown-folder "../markdown/personnalisations" 
        --output-json-file "../data_layer/content/personnalisations.json"
    """
    cli()
