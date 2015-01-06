#ifndef IPCAMERA_H_
#define IPCAMERA_H_

#include "TXSDKCommonDef.h"
#include "TXDeviceSDK.h"

CXX_EXTERN_BEGIN

////////////////////////////////////////////////      ipcamera互联相关接口   ///////////////////////////////////////////////

//视频清晰度
enum definition {
	def_low = 1,     	//低
	def_middle =2,     //中
	def_high = 3,      //高
};

//云台(PTZ)旋转方向
enum rotate_direction {
	rotate_direction_left = 1,     	//左
	rotate_direction_right = 2,     //右
	rotate_direction_up = 3,      //上
	rotate_direction_down = 4,      //下
};

//云台(PTZ)旋转角度范围
enum rotate_degree {
	//水平角度范围
	rotate_degree_h_min = 0,
	rotate_degree_h_max = 360,
	//垂直角度范围
	rotate_degree_v_min = 0,
	rotate_degree_v_max = 180,
};

// 结构化消息的附加参数，传进去的字符串必须 以 0 结尾
typedef struct _tx_ipcamera_extra_msg {
	int msg_time;    //消息发送或接收时间
	int show_time;    // 事件发生时间
	char *data_type;   //字符串，表示存储的类型， PICTURE：图像、VIDEO：视频。
	char *title;               //结构化消息标题;
	char *digest;   // 字符串，简述文字
	char *guidewords;  // 字符串，引导文字
} tx_ipcamera_extra_msg;


//ipcamera交互接口：清晰度调整，截图，报警，交互

typedef struct SDK_API _tx_ipcamera_notify {
	/**
	 * 接口说明：ipcamera清晰度调整回调,调用后返回摄像头的当前分辨率
	 * 参数说明: cur_definition：用于接受清晰度调整后摄像头的当前分辨率，由调用者分配内存
	 */
	int  (*on_set_definition)(int definition,char*  cur_definition,int cur_definition_len);

	/**
	 * 接口说明：ipcamera截图回调
	 * 参数说明:screenshot_file_path:获取截图文件的存储路径,调用者分配内存；
	 * 					screenshot_file_path_length：表示文件路径容许的最大长度；
	 */
	int (*on_get_screenshot)(char* screenshot_file_path, int screenshot_file_path_length);

	/**
	 * 接口说明：ipcamera交互回调，接受来自APP的音频文件
	 * 参数说明: uuid:指示语音文件的存储位置，使用uuid调用ftn_download接口下载音频文件
	 */
	int (*on_receive_audio_msg)(char* audio_file_uuid, int audio_file_uuid_len);

	/**
	 * 接口说明：ipcamera云台控制回调
	 */
	int (*on_control_rotate)(int rotate_direction, int rotate_degree);

	/**
	 * 接口说明：发送报警消息的回调
	 * 参数说明: cookie是在调用相应send函数时从出参中获取的
	 * 错误码表：err_null                   = 0,
     *           err_upload_file_failed     = 1,
     *           err_encode_file_key_failed = 2,
     *           err_send_msg_failed        = 3,
	 */
	void (*on_ipcamera_send_alarm_msg_complete)(const unsigned int cookie, int err_code);

	/**
	 * 接口说明：发送视频留言的回调
	 * 参数说明: cookie是在调用相应send函数时从出参中获取的
	 * 错误码表：err_null                   = 0,
     *           err_upload_file_failed     = 1,
     *           err_encode_file_key_failed = 2,
     *           err_send_msg_failed        = 3,
	 */
	void (*on_ipcamera_send_video_msg_complete)(const unsigned int cookie, int err_code);

	/**
	 * 接口说明：发送语音留言的回调
	 * 参数说明: cookie是在调用相应send函数时从出参中获取的
	 * 错误码表：err_null                   = 0,
     *           err_upload_file_failed     = 1,
     *           err_encode_file_key_failed = 2,
     *           err_send_msg_failed        = 3,
	 */
	void (*on_ipcamera_send_audio_msg_complete)(const unsigned int cookie, int err_code);

} tx_ipcamera_notify;


/**
 * 接口说明： 设置ipcamera相关的回调
 */
SDK_API int ipcamera_set_callback(tx_ipcamera_notify *notify);


/**
 * 接口说明： ipcamera报警
 * 参数说明:  av_file_path:报警视频或视频留言文件的路径  ；
 *            thumbnail_file_path：报警视频文件的预览图（截图）文件路径; 
 *            ipcamera_extra_msg是结构化消息的附加参数
 *            cookie：用于任务配对的任务id，在相应的回调函数中会携带
 */
SDK_API int ipcamera_send_alarm_msg(char* av_file_path, char* thumbnail_file_path, tx_ipcamera_extra_msg *ipcamera_extra_msg, unsigned int * cookie);

/**
 * 接口说明：ipcamera视频
 * 参数说明: video_file_path: 视频文件的路径 ； 
 *           thumbnail_file_path：视频文件的预览图（截图）文件路径; 
 *           ipcamera_extra_msg：是结构化消息的附加参数
 *           cookie：用于任务配对的任务id，在相应的回调函数中会携带
 */
SDK_API int ipcamera_send_video_msg(char* video_file_path, char* thumbnail_file_path, tx_ipcamera_extra_msg *ipcamera_extra_msg, unsigned int * cookie);

/**
 * 接口说明：ipcamera语音
 * 参数说明: audio_file_path:音频文件的路径
 *           audio_duration:音频时长，单位:秒
 *           cookie：用于任务配对的任务id，在相应的回调函数中会携带
 */
SDK_API int ipcamera_send_audio_msg(char* audio_file_path, int audio_duration, unsigned int * cookie);


CXX_EXTERN_END

#endif /* IPCAMERA_H_ */
