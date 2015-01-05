#ifndef __TX_SDK_COMMON_DEF_H__
#define __TX_SDK_COMMON_DEF_H__

#define SDK_API                     __attribute__((visibility("default")))

#ifndef __cplusplus
#   define bool                     _Bool
#   define true                     1
#   define false                    0
#   define CXX_EXTERN_BEGIN
#   define CXX_EXTERN_END
#   define C_EXTERN                 extern
#else
#   define _Bool                    bool
#   define CXX_EXTERN_BEGIN         extern "C" {
#   define CXX_EXTERN_END           }
#   define C_EXTERN
#endif


CXX_EXTERN_BEGIN

//全局错误码表
enum error_code
{
    err_null                                = 0x00000000,       //success
    err_failed                              = 0x00000001,       //failed
    err_unknown                             = 0x00000002,       //未知错误
    err_invalid_param                       = 0x00000003,       //参数非法
    err_buffer_notenough                    = 0x00000004,       //buffer长度不足
    err_mem_alloc                           = 0x00000005,       //分配内存失败
    err_internal                            = 0x00000006,       //内部错误
    err_device_inited                       = 0x00000007,       //设备已经初始化过了
    err_av_service_started                  = 0x00000008,       //av_service已经启动了
    err_invalid_device_info                 = 0x00000009,       //非法的设备信息
    err_invalid_serial_number               = 0x0000000A,       //非法的设备序列号
    err_invalid_fs_handler                  = 0x0000000B,       //非法的读写回调
    err_invalid_device_notify               = 0x0000000C,       //非法的设备通知回调
    err_invalid_av_callback                 = 0x0000000D,       //非法的音视频回调
    err_invalid_system_path                 = 0x0000000E,       //非法的system_path
    err_invalid_app_path                    = 0x0000000F,       //非法的app_path
    err_invalid_temp_path                   = 0x00000010,       //非法的temp_path
    err_not_impl                            = 0x00000011,       //未实现
    err_fetching                            = 0x00000012,       //正在向后台获取数据中
    err_fetching_buff_not_enough            = 0x00000013,       //正在向后台获取数据中 & buffer长度不足
    err_off_line                            = 0x00000014,       //当前没有处于离线状态
 
    err_login_failed                        = 0x00010001,       //登录失败
    err_login_invalid_deviceinfo            = 0x00010002,       //设备信息非法
    err_login_connect_failed                = 0x00010003,       //连接Server失败
    err_login_timeout                       = 0x00010004,       //登录超时
    err_login_eraseinfo                     = 0x00010005,       //擦除设备信息
    err_login_servererror                   = 0x00010006,       //登录Server返回错误
 
    err_msg_sendfailed                      = 0x00020001,       //消息发送失败
    err_msg_sendtimeout                     = 0x00020002,       //消息发送超时
 
    err_av_unlogin                          = 0x00030001,       //未登录的情况下启动音视频服务
 
    err_ft_transfer_failed                  = 0x00040001,       // 文件传输(发送/接收)失败
    err_ft_file_too_large                   = 0x00040002,       // 发送的文件太大
    //...
};

CXX_EXTERN_END


#endif // __TX_SDK_COMMON_DEF_H__