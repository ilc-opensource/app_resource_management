#ifndef __TX_WIFI_SYNC_H
#define __TX_WIFI_SYNC_H
#include "TXSDKCommonDef.h"
/*
 * 由于不知道wifisync 发送端在那个channel上发包，因此需要在每个可能的channel上抓包，分析，重复这个过程，直到回调通知。
 *
 * 具体步骤如下
 * step1. 当前channel若没有信标包，就跳到下一个channel，跳频 建议间隔 10+ ms 否则 转step2
 * step2. 若有信标包，就在当前channel 抓包；抓取时长，建议400+ ms, 没有回调通知转step1，否则转step3
 * step3. 验证wifi用户名和密码到有效性；若有效，转step4，否则转step1
 * step4. 反初始化 wifisync，初始化device。
 *
 *
 */



enum fill80211relust {
	EEROR_SUCCESS       = 0,        //wifi sync 完成
    ERROR_ONCE_SUCCESS  = 1,        //解析为数据包
    ERROR_BEACON        = 2,        //解析为信标包
	ERROR_LEN           = 3,        //包长度错误
	ERROR_NOT_MULTICAST = 4,        //无效包
    ERROR_MAC_NOT_MATCH = 5,        //按Mac 地址过滤
    ERROR_NEED_INIT     = 6,        //wifi sync没有初始化
    ERROR_PARAM         = 7,        //传入到参数不合法
    ERROR_NEED_CONTINUE = 8,        //wifi sync 未完成
    ERROR_NOT_80211_FRAME = 9,      //无效包
    ERROR_DECRYPT         = 10,      //解密出错
    ERROR_VERSION         = 11      //SDK版本不对应
};

typedef struct
{
	char szrouterssid[128];
	char szrouterpswd[128];
    char szsrcip[5];
}tx_wifi_sync_param;

typedef struct _tx_wifi_sync_notify {
	/**
    * wifi sync 完成后回调
	*  pwifi_sync_param     :   包含路由器SSID和密码信息；回调结束后会被销毁。
    *  puserdata            :   保存用户数据,由调用方init时传入,调回调函数的时候再次传入
	*/
	void (*on_wifi_sync_notify)(tx_wifi_sync_param *pwifi_sync_param,void *puserdata);
}tx_wifi_sync_notify;

/**
 * 初始化 wifi sync
 *  pwifi_sync_notify   :   wifi sync 完成后回调通知
 *  szkey               :   解密key
 *  puserdata           :   保存用户数据,由调用方传入,调回调函数的时候再次传入
 */
SDK_API void init_wifi_sync(tx_wifi_sync_notify *pwifi_sync_notify,char *szkey,void *puserdata);

/**
 * 解析 80211 数据
 *  buff                :   80211 frame buffer
 *  nlen                :   80211 frame buffer length
 *  npackoffset         :   QosPacket offset against 80211 frame
 */
SDK_API int fill_80211_frame(const unsigned char *buff,int nlen,int npackoffset);

/**
 * 反初始化 wifi sync
 */
SDK_API void destory_wifi_sync();

#endif //__TX_WIFI_SYNC_H
