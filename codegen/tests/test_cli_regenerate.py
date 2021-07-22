from unittest.mock import patch, MagicMock

import pytest

from codegen.cli_regenerate import (
    mesures_thematiques,
    indicateurs_thematiques,
    mesures_nested_actions,
    indicateurs_universal,
)


@pytest.mark.skip(reason="regen functions are one shot tasks")
@patch("codegen.cli_regenerate.write")
def test_mesures_nested_actions(mock_write: MagicMock):
    mesures_nested_actions()


@pytest.mark.skip(reason="regen functions are one shot tasks")
@patch("codegen.cli_regenerate.write")
def test_mesures_thematiques(mock_write: MagicMock):
    mesures_thematiques(
        mesures_dir="../referentiels/markdown/mesures_citergie",
        thematiques_file="../referentiels/markdown/thematiques_climat_pratic/thematiques.md",
    )


@pytest.mark.skip(reason="regen functions are one shot tasks")
@patch("codegen.cli_regenerate.write")
def test_indicateurs_thematiques(mock_write: MagicMock):
    indicateurs_thematiques(
        indicateurs_dir="../referentiels/markdown/indicateurs_citergie",
        thematiques_file="../referentiels/markdown/thematiques_climat_pratic/thematiques.md",
    )


@pytest.mark.skip(reason="regen functions are one shot tasks")
@patch("codegen.cli_regenerate.write")
def test_indicateurs_universal(mock_write: MagicMock):
    indicateurs_universal()
