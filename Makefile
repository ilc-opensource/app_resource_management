T=$(shell date +%Y_%m_%d_%H_%M)
DIRNAME=$(shell basename `pwd`)
PACK_NAME=$(DIRNAME)_$(T).tgz

pack:
	cd ..; tar --exclude .git -czvf $(PACK_NAME) $(DIRNAME)
