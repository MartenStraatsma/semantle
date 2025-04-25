#################################################
######### server build stage
#################################################

FROM alpine AS build

RUN apk update && \
    apk add --no-cache \
    build-base \
    make \
    boost-dev

WORKDIR /server

COPY src/ ./src/
COPY Makefile .

RUN make

# ENTRYPOINT [ "/bin/sh", "-c", "while true; do sleep 1000; done" ]

# RUN make

#################################################
######### server image
#################################################

FROM alpine

RUN apk update && \
    apk add --no-cache \
    libstdc++

RUN addgroup -S shs && adduser -S shs -G shs
USER shs

COPY --chown=shs:shs --from=build \
    ./server/ \
    ./app/

ENTRYPOINT [ "./app/main", "0.0.0.0", "8080", ".", "100", "spin" ]