#ifndef __TX_MSG_H__
#define __TX_MSG_H__

#include "TXSDKCommonDef.h"

CXX_EXTERN_BEGIN

//消息体：消息结构信息
typedef struct tag_tx_msg
{
    // bool            is_data_point;      // 是否data_point数据
    char *          msg_content;        // 消息buffer
    int             msg_length;         // buffer长度
    unsigned int    msg_cookie;         // msg cookie
}tx_msg;

//消息 接收方/发送方 信息
typedef struct tag_tx_ccmsg_inst_info
{
    unsigned long long          target_id;          // ccmsg target id for send to / from
    unsigned int                appid;
    unsigned int                instid;
    unsigned int                platform;           // 指定平台
    unsigned int                open_appid;         // 开平分配给第三方app的appid
    unsigned int                productid;          //
    unsigned int                sso_bid;            // SSO终端管理分配的appid
    char *                      guid;               // 设备的唯一标识
    int                         guid_len;
}tx_ccmsg_inst_info;

// 消息回调
typedef struct tag_tx_msg_notify
{
    // Receive msg callback
    void (*on_receive_ccmsg)(const tx_ccmsg_inst_info * from_client, const tx_msg * msg);
}tx_msg_notify;


SDK_API int tx_init_msg(const tx_msg_notify * notify);

/**
* 接口说明：发送Client 2 Client 消息 
*/
typedef void (*on_send_ccmsg_result)(int err_code, unsigned long long to_client, const tx_msg * msg);
SDK_API int tx_send_ccmsg(unsigned long long to_client, const tx_msg * msg, on_send_ccmsg_result callback);

typedef void (*on_send_ccmsg_ex_result)(int err_code, const tx_ccmsg_inst_info * to_client, const tx_msg * msg);
SDK_API int tx_send_ccmsg_ex(const tx_ccmsg_inst_info * to_client, const tx_msg * msg, on_send_ccmsg_ex_result callback);

CXX_EXTERN_END

#endif // __TX_MSG_H__