.PHONY : all

all : getFrontEndApp setFrontEndApp getNotification setNotification getDisplaySem setDisplaySem


getFrontEndApp: getFrontEndApp.cpp
	g++ getFrontEndApp.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o getFrontEndApp
setFrontEndApp: setFrontEndApp.cpp
	g++ setFrontEndApp.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o setFrontEndApp
getNotification: getNotification.cpp
	g++ getNotification.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o getNotification
setNotification: setNotification.cpp
	g++ setNotification.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o setNotification
getDisplaySem: getDisplaySem.cpp
	g++ getDisplaySem.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o getDisplaySem
setDisplaySem: setDisplaySem.cpp
	g++ setDisplaySem.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o setDisplaySem


clean:
	rm getFrontEndApp setFrontEndApp getNotification setNotification getDisplaySem setDisplaySem
