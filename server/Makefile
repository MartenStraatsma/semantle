CXX = c++
CXXFLAGS = -pthread -std=c++2c -march=native
OBJS = args.o koreanargs.o autotune.o matrix.o dictionary.o koreandictionary.o loss.o productquantizer.o densematrix.o quantmatrix.o vector.o model.o utils.o meter.o fasttext.o koreanfasttext.o
INCLUDES = -I.
LDFLAGS = -lboost_url -lssl -lcrypto

opt: CXXFLAGS += -O3 -funroll-loops -DNDEBUG
opt: main

coverage: CXXFLAGS += -O0 -fno-inline -fprofile-arcs --coverage
coverage: main

debug: CXXFLAGS += -g -O0 -fno-inline
debug: main

main: src/main.cpp
	$(CXX) $(CXXFLAGS) $(OBJS) src/main_ssl.cpp -o main $(LDFLAGS)