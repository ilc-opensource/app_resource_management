.PHONY : all

all : readFrontEndApp  setFrontEndApp

readFrontEndApp:
	g++ readFrontEndApp.cpp -lrt -O0 -g -mtune=i486 -march=i486 -m32 -o readFrontEndApp

setFrontEndApp:
	g++ setFrontEndApp.cpp -lrt -O0 -g -mtune=i486 -march=i486 -m32 -o setFrontEndApp

clean:
	rm readFrontEndApp setFrontEndApp
