#ifndef __TX_FILE_TRANSFER_H__
#define __TX_FILE_TRANSFER_H__

#include "TXSDKCommonDef.h"
#include "TXMsg.h"

////////////////////////////////////////////////////////////////////////////
//  文件传输接口
////////////////////////////////////////////////////////////////////////////


CXX_EXTERN_BEGIN

/**
* 传输任务类型
*/
enum tx_file_transfer_type
{
    transfet_type_none = 0,
    transfer_type_upload,
    transfer_type_download,
    transfer_type_c2c_in,
    transfer_type_c2c_out,
};

/**
* 通知，回调
*/
typedef struct tag_tx_file_transfer_notify
{
    // 传输进度
    // transfer_progress ： 上传 下载进度
    // max_transfer_progress ： 进度的最大值， transfer_progress/max_transfer_progress 计算传输百分比
    void (*on_transfer_progress)(unsigned long long transfer_cookie, unsigned long long transfer_progress, unsigned long long max_transfer_progress);

    // 传输结果
    void (*on_transfer_complete)(unsigned long long transfer_cookie, int err_code);

    // 收到C2C transfer通知
    void (*on_file_in_come)(unsigned long long transfer_cookie, const tx_ccmsg_inst_info * inst_info);

}tx_file_transfer_notify;

/**
* 任务信息
*/
typedef struct tag_tx_file_transfer_info
{
    char        file_path[1024];    // 文件本地路径
    char        file_key[512];      // 文件的后台索引
    int         key_length;
    int         transfer_type;      // upload  download  c2c_in  c2c_out
    char *      buff_with_file;     // C2C发送文件附带的buffer
    int         buff_length;
    char        bussiness_name[64]; // C2C发送文件时，业务名
}tx_file_transfer_info;

/**
* 初始化传文件
*   notify : 回调
*   path_recv_file : 接收文件的目录
*/
SDK_API int tx_init_file_transfer(tx_file_transfer_notify notify, char * path_recv_file);

/**
* 上传文件
*/
SDK_API int tx_upload_file(char * file_path, unsigned long long * transfer_cookie);

/**
* 下载文件
*/
SDK_API int tx_download_file(char * file_key, int key_length, unsigned long long * transfer_cookie);

/**
* 发送文件到其他端
* buff_with_file & bussiness_name : 发送到对端时，对端可根据bussiness_name，对接收到的文件做不同的处理，buff_with_file可以携带其他参数和信息
*/
SDK_API int tx_send_file_to(unsigned long long target_id, char * file_path, unsigned long long * transfer_cookie, char * buff_with_file, int buff_length, char * bussiness_name);
SDK_API int tx_send_file_to_ex(const tx_ccmsg_inst_info * inst_info, char * file_path, unsigned long long * transfer_cookie, char * buff_with_file, int buff_length, char * bussiness_name);

// /**
// * 接收_拒绝 其他端发过来的文件
// */
// SDK_API int tx_accept_deny_transfer(unsigned long long transfer_cookie, bool accept_deny);

/**
* 取消传输
*/
SDK_API int tx_cancel_transfer(unsigned long long transfer_cookie);

/**
* 查询任务信息
*/
SDK_API int tx_query_transfer_info(unsigned long long transfer_cookie, tx_file_transfer_info * transfer_info);


CXX_EXTERN_END

#endif // __TX_FILE_TRANSFER_H__
