CXX = c++
CXXFLAGS = -pthread
OBJS = args.o dictionary.o productquantizer.o matrix.o qmatrix.o vector.o model.o utils.o fasttext.o
INCLUDES = -I.

opt: CXXFLAGS += -O3 -funroll-loops
opt: main

debug: CXXFLAGS += -g -O0 -fno-inline
debug: main

main: src/main.cpp
	$(CXX) $(CXXFLAGS) src/main.cpp -o main