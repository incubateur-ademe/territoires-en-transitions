variable "APP_NAME" {}
variable "IMAGE_PATH" {}
variable "COMMIT" {}

# répertoire des dockerfiles (passé via GITHUB_ACTION_PATH dans action.yml)
variable "ACTION_DIR" {
  default = ".github/actions/back-build"
}

target "deps" {
  context = "."
  dockerfile = "${ACTION_DIR}/install-deps.dockerfile"
  secret = [
    {
      type: "env"
      id: "BRYNTUM_ACCESS_TOKEN"
    }
  ]
}
target "backend" {
  context = "."
  dockerfile = "${ACTION_DIR}/build-backend.dockerfile"
  contexts = {
    "deps" = "target:deps"
  }
  tags = [ IMAGE_PATH ]
  labels = {
    "commit" = "${COMMIT}"
  }
}
target "tools" {
  context = "."
  dockerfile = "${ACTION_DIR}/build-tools.dockerfile"
  contexts = {
    "deps" = "target:deps"
  }
  tags = [ IMAGE_PATH ]
  labels = {
    "commit" = "${COMMIT}"
  }
}

target "front" {
  context = "."
  dockerfile = "${ACTION_DIR}/build-front.dockerfile"
  args = {
    APP_NAME = "${APP_NAME}"
  }
  contexts = {
    "deps" = "target:deps"
  }
  tags = [ IMAGE_PATH ]
  labels = {
    "commit" = "${COMMIT}"
  }
}
