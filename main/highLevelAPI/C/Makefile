.PHONY : all

CXX_FLAGS=-lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -I../../../../sdk_c/include/

all : getFrontEndApp setFrontEndApp getNotification setNotification

getFrontEndApp: getFrontEndApp.cpp
	g++ getFrontEndApp.cpp $(CXX_FLAGS) -o getFrontEndApp
setFrontEndApp: setFrontEndApp.cpp
	g++ setFrontEndApp.cpp $(CXX_FLAGS) -o setFrontEndApp
getNotification: getNotification.cpp
	g++ getNotification.cpp $(CXX_FLAGS) -o getNotification
setNotification: setNotification.cpp
	g++ setNotification.cpp $(CXX_FLAGS) -o setNotification


clean:
	rm getFrontEndApp setFrontEndApp getNotification setNotification
