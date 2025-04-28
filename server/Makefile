CXX = c++
CXXFLAGS = -pthread -std=c++17 -march=native
INCLUDES = -I.
LDFLAGS = -lfasttext -lboost_url

opt: CXXFLAGS += -O3 -funroll-loops -DNDEBUG
opt: main

coverage: CXXFLAGS += -O0 -fno-inline -fprofile-arcs --coverage
coverage: main

debug: CXXFLAGS += -g -O0 -fno-inline
debug: main

main: src/main.cpp
	$(CXX) $(CXXFLAGS) src/main.cpp -o main $(LDFLAGS)