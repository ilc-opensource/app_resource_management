#ifndef __TX_AUDIO_VIDEO_H__
#define __TX_AUDIO_VIDEO_H__

#include "TXSDKCommonDef.h"

/*extern bool file_start_camera(int bit_rate);
extern bool file_stop_camera();
extern bool file_set_bitrate(int bit_rate);
extern bool file_restart_gop();
extern bool file_start_mic();
extern bool file_stop_mic();
*/

CXX_EXTERN_BEGIN

//////////////////////////////////////////////////////////////////////////////////
//                                     音视频相关接口
//////////////////////////////////////////////////////////////////////////////////

/*
   编码过程中可调节的参数
   1.BitRate必须可以动态调节，不然就不存在流控一说，输出码率要求是CBR，严格按照设置的值输出
   2.调节分辨率是为了和码率适配，在调节码率时选择视觉效果最佳的分辨率，如果分辨率不能实时动态调整，至少需要提供多种分辨率便于切换
   3.编码时QP的范围设置如果暂时无法支持，需要告知现用的QP范围和策略
   4.Gop，Fps必须可以设置，重启GOP必须实现，否则无法控制I帧间隔，也就无法控制接收方看到画面的延时
*/
typedef struct _tx_av_encode_param
{
    int nBitRate;
    int nFps;
    int nGop;
    int nWidth;
    int nHeight;
    int nMaxQP;
    int nMinQP;
}tx_av_encode_param;

/**
 * AV SDK -> Device 回调接口
 *
 * on_start_camera 通知摄像头视频链路已经建立，可以通过 tx_set_video_data 接口向 AV SDK 填充采集到的视频数据
 *
 * on_stop_camera  通知摄像头视频链路已经断开，可以不用再继续采集视频数据
 *
 * on_set_bitrate  视频码率意味着1s产生多少数据，这个参数跟网络带宽的使用直接相关。
 *                 AV SDK 会根据当前的网络情况和Qos信息，给出建议的bitrate，上层应用可以根据这个建议值设置Camera的各项参数，
 *                 如帧率、分辨率，量化参数等，从而获得合适的码率
 *
 * on_restart_gop  如果I帧丢了，那么发再多的P帧也没有多大意义，AV SDK 会在发现这种情况发生的时候主动通知上层重新启动一个I帧。
 *
 * on_start_mic    通知麦克风音频链路已经建立，可以通过 tx_set_audio_data 接口向 AV SDK 填充采集到的音频数据
 *
 * on_stop_mic     通知摄像头音频链路已经断开，可以不用再继续采集音频数据
 *
 * on_recv_audiodata 通知智能设备，有音频数据到达
 *
 * on_recv_videodata 通知智能设备，有视频数据到达
*/
typedef struct _tx_av_callback
{
    //智能设备作为音视频的发送方，下面回调用于采集音视频数据
    bool (*on_start_camera)(int bit_rate);
    bool (*on_stop_camera)();
    bool (*on_set_bitrate)(int bit_rate);
    bool (*on_restart_gop)();
    bool (*on_start_mic)();
    bool (*on_stop_mic)();

    //智能设备作为音视频的接收方，下面回调用于接收音视频数据
    void (*on_recv_audiodata)(unsigned char *pcEncData, int nEncDataLen);
    void (*on_recv_videodata)(unsigned char *pcEncData, int nEncDataLen);
}tx_av_callback;

/**
* 接口说明：启动音视频相关服务，该服务需要登录成功后才能调用，否则会有错误码返回
* 参数说明：enable_fec         发送音视频数据时是否插入容错包，true(加入) false(不加入)
*         enable_simple_send 发送音视频数据时是否采取均匀发送方式 true(不采用) false(采用)
*         callback           音视频回调
* 返回值  ：错误码（见全局错误码表）
*/
SDK_API int tx_start_av_service(bool enable_fec, bool enable_simple_send, tx_av_callback* callback);

/**
* 接口说明：退出所有设备SDK相关逻辑
* 返回值  ：错误码（见全局错误码表）
*/
SDK_API int tx_stop_av_service();

/**
 * 向SDK填充视频数据
 * nGopIndex:Gop的index
 * nFrameIndex:当前帧在所在gop中的index
 * nTotalIndex:当前帧在总编码过程中的index
 */
SDK_API void tx_set_video_data(unsigned char *pcEncData, int nEncDataLen,
        int nFrameType, int nTimeStamps, int nGopIndex, int nFrameIndex, int nTotalIndex, int nAvgQP);
/**
 * 向SDK填充音频数据
 */
SDK_API void tx_set_audio_data(unsigned char *pcEncData, int nEncDataLen);

CXX_EXTERN_END

#endif // __TX_AUDIO_VIDEO_H__
