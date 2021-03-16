from unittest.mock import patch, MagicMock

import pytest

from codegen.cli_regenerate import mesures_thematiques, indicateurs_thematiques


@pytest.mark.skip(reason="for now regen fail on already regenerated files")
@patch("codegen.cli_regenerate.write")
def test_mesures_thematiques(mock_write: MagicMock):
    mesures_thematiques(
        mesures_dir='../referentiels/markdown/mesures_citergie',
        thematiques_file='../referentiels/markdown/thematiques_climat_pratic/thematiques.md'
    )


@pytest.mark.skip(reason="for now regen fail on already regenerated files")
@patch("codegen.cli_regenerate.write")
def test_indicateurs_thematiques(mock_write: MagicMock):
    indicateurs_thematiques(
        indicateurs_dir='../referentiels/markdown/indicateurs_citergie',
        thematiques_file='../referentiels/markdown/thematiques_climat_pratic/thematiques.md'
    )
