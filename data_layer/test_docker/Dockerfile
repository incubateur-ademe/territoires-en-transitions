FROM postgres:14

RUN apt-get update
RUN apt-get install cpanminus -y
RUN cpanm TAP::Parser::SourceHandler::pgTAP

