import os

client_dir = '../client_new'
api_dir = '../../territoiresentransitions_api/api'

thematique_markdown_file = '../referentiels/markdown/thematiques_climat_pratic/thematiques.md'
thematique_client_output_dir = os.path.join(client_dir, 'generated/data')

mesures_markdown_dir = '../referentiels/markdown/mesures_citergie'
mesures_orientations_dir = '../referentiels/markdown/orientations_economie_circulaire'
mesures_client_output_dir = os.path.join(client_dir, 'dist')

indicateurs_markdown_dir = '../referentiels/markdown/indicateurs_citergie'
indicateurs_client_output_dir = os.path.join(client_dir, 'dist')

shared_markdown_dir = 'definitions/shared'
shared_output_client_dir = os.path.join(client_dir, 'generated/models')
shared_output_api_dir = os.path.join(api_dir, 'models/generated')
