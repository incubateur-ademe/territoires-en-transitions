# GitHub action self-hosted runner

## Constuire et pousser l'image du runner

```sh
docker build . -t ghcr.io/territoiresentransitions/gh-self-hosted-runner --platform linux/amd64
docker push ghcr.io/territoiresentransitions/gh-self-hosted-runner
```
