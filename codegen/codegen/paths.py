import os

client_dir = "../app.territoiresentransitions.react/src"
api_dir = "../../api/api"

thematique_markdown_file = (
    "../referentiels/markdown/thematiques_climat_pratic/thematiques.md"
)
thematique_client_output_dir = os.path.join(client_dir, "generated/data")

mesures_markdown_dir = "../referentiels/markdown/mesures_citergie"
orientations_markdown_dir = "../referentiels/markdown/orientations_economie_circulaire"
mesures_client_output_dir = os.path.join(client_dir, "dist")

indicateurs_markdown_dir = "../referentiels/markdown/indicateurs"
indicateurs_client_output_dir = os.path.join(client_dir, "dist")

shared_markdown_dir = "definitions/shared"
shared_client_models_dir = os.path.join(client_dir, "generated/models")
shared_client_data_dir = os.path.join(client_dir, "generated/data")
shared_api_models_dir = os.path.join(api_dir, "models/generated")
shared_api_data_dir = os.path.join(api_dir, "data/generated")
