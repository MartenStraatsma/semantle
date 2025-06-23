# Semantle

Small word guessing game based on semantic similarity.
Unlike competitors, similarity scores are determined by artificial intelligence in realtime.


## Website

Made without any frameworks; just plain HTML, CSS and JS.
I am not a web developer.
Any and all suggestions or improvements are much appreciated.


## Docker Server

HTML server built with [Boost.Beast](https://github.com/boostorg/beast), based on their [fast HTTP server example](https://www.boost.org/doc/libs/1_88_0/libs/beast/example/http/server/fast/http_server_fast.cpp).
AI framework by [my FastText fork](https://github.com/MartenStraatsma/KoreanWordVectorsDocker).
Kept lightweight by deploying on [Alpine Linux Docker](https://hub.docker.com/_/alpine/).

Build Docker image with
```shell
docker build . -t semantle-server
```

FastText needs excessive RAM to load all models, but is not dependent on fast memory access to guarantee server responsiveness.
To this end, loading models in swap memory is highly recommended.
```shell
docker run \
-p 8080-8082:80-82 \
--mount type=bind,source=/absolute/path/to/model/files,target=/var/www \
--memory="256m" \
--memory-swap="28g" \
-d semantle-server
```


## References
Concept "inspired" by [semantle.com](https://semantle.com/).
Style "inspired" by [contexto.me](https://contexto.me/en/).

Similarity score AI by [my FastText fork](https://github.com/MartenStraatsma/KoreanWordVectorsDocker).
English & Dutch models by [Facebook Research](https://fasttext.cc/docs/en/crawl-vectors.html).
Korean Model by me (based on the works of [박승준](https://github.com/SungjoonPark/KoreanWordVectors)).

English word list by [Google](https://github.com/david47k/top-english-wordlists).
Dutch word list by me.
Korean word list by [Julien Shim](https://github.com/julienshim/combined_korean_vocabulary_list).
