.PHONY : all

all : readFrontEndApp setFrontEndApp addNotification readNotification

readFrontEndApp:
	g++ readFrontEndApp.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o readFrontEndApp
setFrontEndApp:
	g++ setFrontEndApp.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o setFrontEndApp
addNotification:
	g++ addNotification.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o addNotification
readNotification:
	g++ readNotification.cpp -lrt -lpthread -O0 -g -mtune=i486 -march=i486 -m32 -o readNotification

clean:
	rm readFrontEndApp setFrontEndApp addNotification readNotification
