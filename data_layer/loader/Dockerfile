# used to load content with psql and curl.

FROM postgres:14
RUN apt-get update
RUN apt-get install -y curl build-essential cpanminus perl perl-doc libdbd-pg-perl postgresql-client
RUN cpanm --quiet --notest App::Sqitch
