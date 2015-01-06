#ifndef __TX_DEVICE_SDK_H__
#define __TX_DEVICE_SDK_H__

#include "TXAudioVideo.h"
#include "TXMsg.h"
#include "TXDataPoint.h"
#include "TXFileTransfer.h"

CXX_EXTERN_BEGIN

//设备信息：需要在初始化设备时提供的一些硬件相关信息，比如操作系统、ip地址等等
typedef struct _tx_device_info
{
    //操作系统信息
    int                         os_platform_len;
    unsigned char *             os_platform;          //操作系统类型:Ios,Android,Synbian等
    int                         os_version_len;
    unsigned char *             os_version;           //操作系统版本

    //网络信息
    int                         nettype;              //接入网络类型: 0:未知,1:3G 2:WIFI
    int                         netdetail_len;
    unsigned char *             netdetail;            //接入网络详细信息，主要指运营商：中国移动、中国联通等
    int                         address_len;
    unsigned char *             address;              //接入点地理信息
    int                         apn_len;
    unsigned char *             apn;                  //接入点APN(Access Point Name)

    //硬件信息
    int                         device_name_len;
    unsigned char *             device_name;           //设备名称
    int                         device_type_len;
    unsigned char *             device_type;           //设备类型
    int                         device_serial_number_len;
    unsigned char *             device_serial_number;    //设备序列号
    int                         device_license_len;
    unsigned char *             device_license;        //设备LICENSE

    //即通Server分配的信息
    int                         product_id;            //每一个厂商的每一种类型的设备对应的一个id
    int                         product_secret_len;
    unsigned char *             product_secret;        //每一个厂商的每一种类型的设备对应的一段buffer
} tx_device_info;

//设备绑定者信息
typedef struct tag_tx_binder_info
{
    int                 type;			//绑定者类型
    unsigned long long  tinyid;			//绑定者tinyid
    unsigned long long  uin;			//绑定者uin
    char                nick_name[128];	//绑定者昵称
    int                 gender;			//绑定者性别
    char                head_url[1024];	//绑定者头像url
}tx_binder_info;

//设备通知：登录、在线状态、消息等相关的事件通知
typedef struct _tx_device_notify
{
    // Login complete callback
    void (*on_login_complete)(int error_code);

    // Online status changed ---- status取值为：11 在线、21 离线
    void (*on_online_status)(int old_status,  int new_status);

    // Shutdown callback
    void (*on_shutdown)(int error_code);

    // binder list change callback
    void (*on_binder_list_change)(int error_code, tx_binder_info * pBinderList, int nCount);
} tx_device_notify;


//SDK初始化目录：SDK会在这些目录下写文件，厂商需要同时指定每个目录下可写存储空间的大小(单位：字节)，SDK会保证不把设备写爆.
//这三个目录中的system_path必须提供；app_path尽量提供，以方便追查问题；temp_path建议提供
//这三个目录取值可以相同，如果相同，需要注意合理分配每个目录可写存储空间的大小
typedef struct _tx_init_path
{
    //SDK会在该目录下写入保证正常运行必需的配置信息；
    //SDK对该目录的存储空间要求小（最小大小：10K，建议大小：100K），SDK写入次数较少，读取次数较多
    char *                  system_path;
    unsigned int            system_path_capicity;

    //SDK会在该目录下写入运行过程中的异常错误信息
    //SDK对该目录的存储空间要求较大（最小大小：500K，建议大小：1M），SDK写入次数较多，读取次数较少
    char *                  app_path;
    unsigned int            app_path_capicity;

    //SDK会在该目录下写入临时文件
    char *                  temp_path;
    unsigned int            temp_path_capicity;
} tx_init_path;


//设备绑定者类型
enum tx_binder_type
{
	binder_type_unknown         = 0,
	binder_type_owner           = 1, //主人
	binder_type_sharer          = 2, //共享者
};

//设备绑定者性别
enum tx_binder_gender
{
	binder_gender_unknown       = -1,
	binder_gender_male          = 0, //男
	binder_gender_female        = 1, //女
};


/**
* 接口说明：初始化设备SDK
*/
SDK_API int tx_init_device(tx_device_info *info, tx_device_notify *notify, tx_init_path* init_path);

/**
* 接口说明：退出所有设备SDK相关逻辑
*/
SDK_API int tx_exit_device();

/**
 * 接口说明:获取SDK版本号
 * 参数说明:buffer由调用者分配，*length指定buffer的长度
 * 返回值　:
 *        当length为NULL时：返回err_invalid_param(0x3)
 *        当length非NULL时：
 *              当buffer长度不足时:
 *                  返回err_buffer_notenough(0x4),*length被修改为实际需要的长度(调用者可根据该长度重新分配buffer然后再次调用该API)
 *              否则
 *                  返回err_null(0x0),将SDK版本号写入到buffer所指的缓冲区中，*length为实际写入的长度
 */
SDK_API int tx_get_sdk_version(char * buffer, unsigned int * length);

/**
 * 接口说明:用于设置写log的回调
 * 回调函数参数说明：
 *         level   log级别 取值有 0 严重错误；1 错误；2 警告；3 提示；4 调试
 *         module  模块
 *         line    行号
 *         message log内容
 */
typedef void (*tx_log_func)(int level, const char* module, int line, const char* message);
SDK_API void tx_set_log_func(tx_log_func log_func);

/**
* 接口说明：获取设备绑定者列表
*/
typedef void (*on_get_binder_list_result)(tx_binder_info * pBinderList, int nCount);
SDK_API int tx_get_binder_list(tx_binder_info * pBinderList, int* nCount, on_get_binder_list_result callback);

/**
* 接口说明：获取设备DIN
*/
SDK_API unsigned long long tx_get_self_din();

/**
* 接口说明：设备重新登录
*/
SDK_API int tx_device_relogin();

CXX_EXTERN_END




#endif // __TX_DEVICE_SDK_H__
