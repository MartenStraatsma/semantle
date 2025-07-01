#################################################
######### FastText Build Stage
#################################################

FROM alpine AS prebuild

RUN apk update && \
    apk add --no-cache \
    git \
    build-base

RUN git clone https://github.com/MartenStraatsma/KoreanWordVectorsDocker
WORKDIR /KoreanWordVectorsDocker/src
RUN make args.o koreanargs.o autotune.o matrix.o dictionary.o koreandictionary.o loss.o productquantizer.o densematrix.o quantmatrix.o vector.o model.o utils.o meter.o fasttext.o koreanfasttext.o

#################################################
######### Server Build Stage
#################################################

FROM alpine AS build

RUN apk update && \
    apk add --no-cache \
    build-base \
    boost-dev \
    openssl-dev

COPY --from=prebuild /KoreanWordVectorsDocker/src/*.o /server/
COPY --from=prebuild /KoreanWordVectorsDocker/src/src/*.h /server/src/
COPY /src/ /server/src/
COPY /Makefile /server/
    
WORKDIR /server/
RUN make -B

#################################################
######### Server Image
#################################################

FROM alpine

RUN apk update && \
    apk add --no-cache \
    libstdc++ \
    boost-url \
    openssl-libs-static

RUN addgroup -S shs && adduser -S shs -G shs
USER shs

COPY --chown=shs:shs --from=build \
    /server/*.o \
    ./app/

COPY --chown=shs:shs --from=build \
    ./server/main \
    ./app/

ENTRYPOINT [ "./app/main" ]