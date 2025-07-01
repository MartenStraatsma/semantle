CXX = c++
CXXFLAGS = -pthread -std=c++2c -march=native
OBJS = args.o koreanargs.o autotune.o matrix.o dictionary.o koreandictionary.o loss.o productquantizer.o densematrix.o quantmatrix.o vector.o model.o utils.o meter.o fasttext.o koreanfasttext.o
INCLUDES = -I.
LDFLAGS = -lboost_url -lssl -lcrypto

opt: CXXFLAGS += -O3 -funroll-loops -DNDEBUG
opt: main_ssl

coverage: CXXFLAGS += -O0 -fno-inline -fprofile-arcs --coverage
coverage: main_ssl

debug: CXXFLAGS += -g -O0 -fno-inline
debug: main_ssl

main: src/main.cpp src/fields_alloc.hpp
	$(CXX) $(CXXFLAGS) $(OBJS) src/main.cpp -o main -lboost_url

main_ssl: src/main_ssl.cpp  src/fields_alloc.hpp src/server_certificate.hpp
	$(CXX) $(CXXFLAGS) $(OBJS) src/main_ssl.cpp -o main_ssl $(LDFLAGS)