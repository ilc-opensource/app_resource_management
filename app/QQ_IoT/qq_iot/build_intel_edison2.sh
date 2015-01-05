source /opt/poky-edison/1.6/environment-setup-core2-32-poky-linux

i586-poky-linux-gcc ./audiovideo.c ./main.c ./amr/codec/audio_format_convert.c ./amr/codec/amrnb.c -o qq_iot -I'./amr/codec/' -I'./amr/opencore-amr-0.1.3/x86/include' -L'./amr/opencore-amr-0.1.3/x86/lib'  libtxdevicesdk.so -lpthread -lopencore-amrnb -O0 -g3 -m32 
