#ifndef __TX_DATA_POINT_H__
#define __TX_DATA_POINT_H__

#include "TXSDKCommonDef.h"
#include "TXMsg.h"


CXX_EXTERN_BEGIN

//data point 数据
typedef struct _tx_api_data_point
{
    unsigned int    property_id;        // 属性ID
    char*           point_val;          // 属性val，当apiname为set_data_point_res时，如果出错或没有返回值可以不填
    int             val_length;         // 属性val的长度
    char*           val_type;           // 属性类型，为int32,bool,string,char,decimal,int64,uint32,uint64
    int             type_length;        // 属性类型的长度
    char*           seq;                // 序列号，如果填了序列号，后台实现根据序列号记录其操作状态，app可根据序列号来判断这个操作是否成功，seq的格式为guid_propertyid_32字节的字符串
    int             seq_length;         // seq的长度，32Bytes
    int             ret_code;           // 当apiname为set_data_point_res时，此值有意义，表示设置的返回值
    char*           err_msg;            // 当apiname为set_data_point_res时，此值有意义，表示设置的错误码及其返回信息
    int             err_msg_length;     // err_msg的长度
} tx_api_data_point;

typedef struct tag_tx_open_platform_notify
{
    void (*on_receive_data_point)(const tx_ccmsg_inst_info * from_client, char * api_name, int api_len, tx_api_data_point * data_points, int data_points_count);
}tx_open_platform_notify;


SDK_API int tx_init_open_platform(const tx_open_platform_notify * notify);

typedef void (*on_report_data_point)(int err_code, unsigned int cookie, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count);
SDK_API int tx_report_data_point(unsigned int cookie, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, on_report_data_point callback);

// 发送C2C datapoint数据
typedef void (*on_send_cc_data_point_result)(int err_code, unsigned long long to_client, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, unsigned int cookie);
SDK_API int tx_send_cc_data_point(unsigned long long to_client, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, unsigned int cookie, on_send_cc_data_point_result callback);

typedef void (*on_send_cc_data_point_ex_result)(int err_code, const tx_ccmsg_inst_info * to_client, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, unsigned int cookie);
SDK_API int tx_send_cc_data_point_ex(const tx_ccmsg_inst_info * to_client, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, unsigned int cookie, on_send_cc_data_point_ex_result callback);

/**
* 接口说明：把datapoint数据序列化为buffer
*/
SDK_API int tx_convert_data_point_to_buff(const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count, char * buff, int * buff_len);
/**
* 接口说明：把buffer反序列化为datapoint数据
*/
SDK_API int tx_convert_buff_to_data_point(const char * buff, int buff_len, char* api_name, int * api_len, tx_api_data_point data_points[], int * data_points_count);
/**
* 接口说明：释放tx_convert_buff_to_data_point临时分配的内存
*/
SDK_API void tx_release_data_point_from_buff(tx_api_data_point data_points[], int data_points_count);


enum DPStructuringMsgType
{
    msg_type_none,
    //    msg_type_text       = 10000,    // 文本消息
    msg_type_video      = 10001,    // 视频消息
    msg_type_picture    = 10002,    // 图片消息
    msg_type_audio      = 10003,    // 语音消息
    //    msg_type_structing  = 10004,    // 结构化消息
    msg_type_alarm      = 10005,    // 视频报警
};

typedef struct tag_dps_msg_notify
{
    void (*on_file_transfer_progress)(const unsigned int cookie, unsigned long long transfer_progress, unsigned long long max_transfer_progress);
    void (*on_send_structuring_msg_ret)(const unsigned int cookie, int err_code);
}dps_msg_notify;

typedef struct tag_dpstructuring_msg
{
    // char *类型全为'\0'结尾的字符串
    unsigned int            msg_type;           // DataPoint properid
    unsigned int            msg_time;           // 消息发送或接收时间
    unsigned int            show_time;          // 事件发生时间
    unsigned int            duration;           // 时长 单位:秒
    char *                  file_path;          // 附带文件的path
    char *                  thumb_path;         // 缩略图path
    char *                  data_type;          // 字符串，表示存储的类型， PICTURE：图像、VIDEO：视频
    char *                  title;              // 结构化消息标题
    char *                  digest;             // 字符串，简述文字
    char *                  guide_words;        // 字符串，引导文字
    char *                  url;
    char *                  ext;                // 扩展字段
    unsigned long long *    to_targetids;       // 指定发给某些target
    unsigned int            to_targetids_count; // 指定发给某些target的count
}dpstructuring_msg;

SDK_API void send_data_point_structuring_msg(const dpstructuring_msg * msg, dps_msg_notify * notify, unsigned int * cookie);

CXX_EXTERN_END

#endif // __TX_DATA_POINT_H__