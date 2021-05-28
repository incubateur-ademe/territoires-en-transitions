"""Générateur pour les mesures, génère les exemples dans /generated/citergie."""
from __future__ import annotations

import warnings
from typing import List

from mistletoe import Document

from codegen.action.read import build_action


def build_mesure(doc: Document) -> dict:
    """Extract mesures from markdown AST"""
    warnings.warn('use build_action instead', category=DeprecationWarning)
    return build_action(doc)


def filter_indicateurs_by_mesure_id(indicateurs: List[dict], mesure_id: str) -> List[dict]:
    return [indicateur for indicateur in indicateurs if mesure_id in indicateur['mesures']]


