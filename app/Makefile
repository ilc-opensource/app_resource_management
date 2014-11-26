SDK_DIR=../../sdk_c

all: build pack copy

build:
	make -C $(SDK_DIR) clean
	make -C $(SDK_DIR) Release=1
	make -C $(SDK_DIR) Release=1 test

pack:
	make -C $(SDK_DIR)/test pack

copy: pack
	tar -xzvf $(SDK_DIR)/test/app_packs.tgz


.PHONY: build pack copy
