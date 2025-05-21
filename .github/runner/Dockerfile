# Ref: https://www.koyeb.com/tutorials/deploying-github-actions-self-hosted-runners-on-koyeb
FROM ubuntu:latest

ENV RUNNER_ARCH=x64
ENV RUNNER_VERSION=2.309.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libicu-dev \
    libssl-dev \
    netcat

WORKDIR /gh-runner

RUN curl -o actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz -L \
            https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz

RUN tar xzf actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz

COPY entrypoint.sh .

RUN adduser --no-create-home ghrunner -uid 1001
RUN chown -R ghrunner:ghrunner /gh-runner

USER ghrunner

EXPOSE 3000
ENTRYPOINT ["sh", "/gh-runner/entrypoint.sh"]
