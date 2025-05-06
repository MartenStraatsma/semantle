#################################################
######### server build stage
#################################################

FROM alpine AS build

RUN apk update && \
    apk add --no-cache \
    build-base \
    make \
    boost-dev \
    fasttext-dev

WORKDIR /server

COPY src/ ./src/
COPY Makefile .

RUN make

#################################################
######### server image
#################################################

FROM alpine

RUN apk update && \
    apk add --no-cache \
    libstdc++ \
    boost-url \
    fasttext-libs

RUN addgroup -S shs && adduser -S shs -G shs
USER shs

COPY --chown=shs:shs --from=build \
    ./server/main \
    ./app/

ENTRYPOINT [ "./app/main" ]