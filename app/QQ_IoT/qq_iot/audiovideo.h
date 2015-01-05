#ifndef __AUDOVIDEO_H__
#define __AUDOVIDEO_H__

#include "TXDeviceSDK.h"

extern bool file_start_camera(int bit_rate);
extern bool file_stop_camera();
extern bool file_set_bitrate(int bit_rate);
extern bool file_restart_gop();
extern bool file_start_mic();
extern bool file_stop_mic();


#endif /* __AUDOVIDEO_H__ */
