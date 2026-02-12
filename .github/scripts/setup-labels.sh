#!/bin/bash

# Script pour configurer les labels GitHub automatiquement
# Usage: ./setup-labels.sh

set -e

# Vérifier que GITHUB_TOKEN est défini
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is required"
    exit 1
fi

# Vérifier que le repository est défini
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "Error: GITHUB_REPOSITORY environment variable is required"
    exit 1
fi

# Fonction pour créer un label
create_label() {
    local name="$1"
    local color="$2"
    local description="$3"

    echo "Creating label: $name"

    # Vérifier si le label existe déjà
    if curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$GITHUB_REPOSITORY/labels/$name" > /dev/null 2>&1; then
        echo "Label '$name' already exists, updating..."
        curl -s -X PATCH \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$GITHUB_REPOSITORY/labels/$name" \
            -d "{\"color\":\"$color\",\"description\":\"$description\"}"
    else
        echo "Creating new label: $name"
        curl -s -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$GITHUB_REPOSITORY/labels" \
            -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$description\"}"
    fi
}

# Labels de versioning
create_label "major" "d73a4a" "Breaking changes - bump major version"
create_label "minor" "0075ca" "New features - bump minor version"
create_label "patch" "28a745" "Bug fixes - bump patch version"

# Labels de catégorisation
create_label "breaking-change" "d73a4a" "Breaking changes that require migration"
create_label "enhancement" "0075ca" "New features and improvements"
create_label "bug" "d73a4a" "Bug fixes"
create_label "documentation" "0075ca" "Documentation updates"
create_label "chore" "6f42c1" "Maintenance tasks"
create_label "security" "d73a4a" "Security fixes"

echo "Labels configuration completed!"
