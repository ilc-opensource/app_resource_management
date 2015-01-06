#include "stdlib.h"
#include "stdio.h"
#include "string.h"
#include "pthread.h"
#include "TXDeviceSDK.h"
#include "audiovideo.h"
#include "ipcamera.h"
#include "TXSmartLink.h"
#include <unistd.h>

#define DB_FILE "./filedemo.db"

#define c_Print_Ctrl_Off 		"\033[0m"

#define c_CharColor_Black 		"\033[1;30m"
#define c_CharColor_Red 		"\033[1;31m"
#define c_CharColor_Green 		"\033[1;32m"
#define c_CharColor_yellow      "\033[1;33m"
#define c_CharColor_Blue 		"\033[1;34m"
#define c_CharColor_Purple      "\033[1;35m"
#define c_CharColor_DarkGreen   "\033[1;36m"
#define c_CharColor_White 		"\033[1;37m"


#define PRINTF_FUNC() printf(c_CharColor_Green"%s:(%d)"c_Print_Ctrl_Off" -- ", __FUNCTION__, __LINE__);

static bool g_start_av_service = false;

static bool g_device_down = true;

void OnReortDataPoint(int err_code, unsigned int cookie, const char* api_name, int api_len, tx_api_data_point data_points[], int data_points_count)
{
    PRINTF_FUNC()
    printf("ret[%d] api[%s] api_len[%d]\n", err_code, api_name, api_len);
}

void OnReceiveDataPoint(const tx_ccmsg_inst_info * from_client, char * api_name, int api_len, tx_api_data_point * data_points, int data_points_count)
{
    PRINTF_FUNC()
    printf("data point api:%s, len %d, from %llu\n", api_name, api_len, from_client->target_id);
    int i=0;
    while(i<data_points_count)
    {
        printf("\tdp%d.property_id:%u\n", i, data_points[i].property_id);
        printf("\tdp%d.point_val:%s\n", i, data_points[i].point_val);
        printf("\tdp%d.val_type:%s\n", i, data_points[i].val_type);
        printf("\tdp%d.seq:%s\n", i, data_points[i].seq);
        printf("\tdp%d.ret:%d\n", i, data_points[i].ret_code);
        printf("\tdp%d.err_msg:%s\n", i, data_points[i].err_msg);

        ++i;
    }
}

void send_report_msg()
{
//    tx_test(); return;

	tx_api_data_point data_points[10] = {0};
	data_points[0].property_id = 10003;
	data_points[0].point_val = "{\"msg_time\":1410419831,\"file_key\":\"test file key\"}";
    data_points[0].val_length = strlen(data_points[0].point_val);
	data_points[0].val_type = "json";
    data_points[0].type_length = strlen(data_points[0].val_type);
    int i =0;
    for(i=0; i<data_points[0].val_length; ++i)
    {
        printf("%c", data_points[0].point_val[i]);
    }
    printf("\n\tlen:%d, point_val:[%s]\n", data_points[0].val_length, data_points[0].point_val);

    data_points[1].property_id = 10001;
    data_points[1].point_val = "{\"msg_time\":1410419831,\"title\":\"小Q机器人\",\"guidewords\":\"点击查看图像\",\"appear_time\":1410419800,\"cover_key\":\"cover_key test1\",\"digest\":\"家里有异常情况1\",\"media_key\":\"124badfsdf1agsgsdf\",\"dskey\":\"dskey111\"}";
    data_points[1].val_length = strlen(data_points[1].point_val);
    data_points[1].val_type = "json";
    data_points[1].type_length = strlen(data_points[1].val_type);

    data_points[2].property_id = 10005;
    data_points[2].point_val = "{\"msg_time\":1410419831,\"title\":\"小Q机器人\",\"appear_time\":1410419831,\"cover_key\":\"这是 cover key\",\"digest\":\"这是digest,小伙计 点击查看图像\",\"guidewords2\":\"这是guidewords\",\"media_key\":\"uuid-xxx2x-xx-x2xx\",\"to_tinyid\":144115197715841001}";
    data_points[2].val_length = strlen(data_points[1].point_val);
    data_points[2].val_type = "json";
    data_points[2].type_length = strlen(data_points[1].val_type);

    data_points[3].property_id = 10002;
    data_points[3].point_val = "{\"msg_time\":1410419831,\"title\":\"小Q机器人2\",\"appear_time\":1410419831,\"cover_key\":\"这是 cover key\",\"digest\":\"33点击查看图像\",\"guidewords\":\"这是guidewords33\",\"media_key\":\"uuid-xxx2x-33-x2xx\",\"to_tinyid\":144115197715841222}";
    data_points[3].val_length = strlen(data_points[1].point_val);
    data_points[3].val_type = "json";
    data_points[3].type_length = strlen(data_points[1].val_type);
	//tx_send_report_msg2("report_datapoint", data_points, 1); return;
    tx_report_data_point(0, "report_datapoint", strlen("report_datapoint"), data_points, 1, OnReortDataPoint);
//    tx_send_cc_data_point(144115197715841041, "report_datapoint", strlen("report_datapoint"), data_points, 1, 0, 0);
}

void on_login_complete(int errcode)
{
    printf("on_login_complete | code[%d]\n", errcode);

   // send_report_msg();
}

void on_online_status(int old, int new)
{
    printf("on_online_status: old[%d] new[%d]\n", old, new);

    g_device_down = false;
    //第一次上线成功后，启动视频服务
    if(11 == new && !g_start_av_service)
    {
		tx_av_callback avcallback = {0};
		avcallback.on_start_camera = file_start_camera;
		avcallback.on_stop_camera  = file_stop_camera;
		avcallback.on_set_bitrate  = file_set_bitrate;
		avcallback.on_restart_gop  = file_restart_gop;
		avcallback.on_start_mic    = file_start_mic;
		avcallback.on_stop_mic     = file_stop_mic;
		int ret = tx_start_av_service(false, true, &avcallback);
		if (err_null != ret)
		{
			printf("tx_start_av_service failed [%d]\n", ret);
		}
		else
		{
			printf("tx_start_av_service successed\n");
		}

		g_start_av_service = true;
    }
}

// 绑定列表变化通知
void on_binder_list_change(int error_code, tx_binder_info * pBinderList, int nCount)
{
	printf("on_binder_list_change, %d binder: \n", nCount);
	int i = 0;
	for (i = 0; i < nCount; ++i )
	{
		printf("binder uin[%llu], nick_name[%s]\n", pBinderList[i].uin, pBinderList[i].nick_name);
	}
}

void on_send_ccmsg(int err_code, unsigned long long to_client, const tx_msg * msg)
{
    PRINTF_FUNC()
    printf("ret[%d] to[%llu] content[%s]\n", err_code, to_client, msg->msg_content);
}

void on_send_ccmsg_ex(int err_code, const tx_ccmsg_inst_info * to_client, const tx_msg * msg)
{
    PRINTF_FUNC()
    printf("ret[%d] to[%llu] content[%s]\n", err_code, to_client->target_id, msg->msg_content);
}

void on_receive_ccmsg(const tx_ccmsg_inst_info * from_client, const tx_msg * msg)
{
    if(!from_client || !msg) return;

    PRINTF_FUNC()
    printf("from[%llu] content[%s]\n", from_client->target_id, msg->msg_content);

    tx_msg newMsg = {0};
    char msgBuf[1024] = {0};
    char tmpStr[1024] = {0};
    memcpy(tmpStr, msg->msg_content, msg->msg_length);
    snprintf(msgBuf, 1024, "来自设备的应答：%s", tmpStr);
    newMsg.msg_content = msgBuf;
    newMsg.msg_length = strlen(msgBuf);

    if(msg->msg_content && !strncmp("system", msg->msg_content,strlen("system")))
    {
    	printf("系统消息测试：%d\n",ipcamera_send_alarm_msg(NULL,NULL, NULL, NULL) );
    }


    //tx_send_ccmsg(from_client->target_id, &newMsg, on_send_ccmsg);

    tx_send_ccmsg_ex(from_client, &newMsg, on_send_ccmsg_ex);

    return;
}

void ontransferprogress(unsigned long long transfer_cookie, unsigned long long transfer_progress, unsigned long long max_transfer_progress)
{
    PRINTF_FUNC()
    printf("========> on file progress %f%%\n", transfer_progress * 100.0 / max_transfer_progress);
}

    // 传输结果
void ontransfercomplete(unsigned long long transfer_cookie, int err_code)
{
    PRINTF_FUNC()
    printf("==========================ontransfercomplete==============================\n");
    tx_file_transfer_info ftInfo = {0};
    tx_query_transfer_info(transfer_cookie, &ftInfo);
    printf("errcode %d, bussiness_name [%s], file path [%s]\n", err_code, ftInfo.bussiness_name,  ftInfo.file_path);
    printf("===============================================================================\n");
}

    // 收到C2C transfer通知
void onrecvfile(unsigned long long transfer_cookie, const tx_ccmsg_inst_info * inst_info)
{
    PRINTF_FUNC()
    ;
}

void testUpload()
{
    //tx_upload_file("./iPhone.dev.pdf", 0);
    tx_upload_file("/home/root/QQ_IoT/zc.txt", 0);
}

void testSendAlarm()
{
	PRINTF_FUNC()
	printf("====================testSendFile()===================\n");

	time_t timestamp;
	time(&timestamp);

	char *path = "./QQQQQQQQQQQ.jpg";
	char *thumb = "thumb.png";     // 缩略图
	tx_ipcamera_extra_msg ipcamera_extra_msg;
	ipcamera_extra_msg.msg_time = timestamp;
	ipcamera_extra_msg.data_type = "PICTURE";
	ipcamera_extra_msg.title = "发现家里异常";
	ipcamera_extra_msg.show_time = timestamp;
	ipcamera_extra_msg.digest = "SNG大本营部落成立啦！快加入与千万用户尽情畅聊吧。";
	ipcamera_extra_msg.guidewords = "查看图片";

	unsigned int cookie = 0;
	ipcamera_send_alarm_msg(path, thumb, &ipcamera_extra_msg, &cookie);
	printf("====================cookie == %d ===================\n", cookie);
}

void testSendAudio()
{
	PRINTF_FUNC()
	printf("====================testSendAudio()===================\n");

	//char *path = "./testAudio.mp3";
	char *path = "/home/root/QQ_IoT/testAudio.mp3";
	unsigned int cookie = 0;
	ipcamera_send_audio_msg(path, 5, &cookie);
	printf("====================cookie == %d ===================\n", cookie);
}

void testSendVideo()
{
	PRINTF_FUNC()
	printf("====================testSendVideo()===================\n");

	time_t timestamp;
	time(&timestamp);

	char *path = "./testVideo.mp4";
	char *thumb = "thumb.png";     // 缩略图
	tx_ipcamera_extra_msg ipcamera_extra_msg;
	ipcamera_extra_msg.msg_time = timestamp;
	ipcamera_extra_msg.data_type = "VIDEO";
	ipcamera_extra_msg.title = "发现家里异常";
	ipcamera_extra_msg.show_time = timestamp;
	ipcamera_extra_msg.digest = "SNG大本营部落成立啦！快加入与千万用户尽情畅聊吧。";
	ipcamera_extra_msg.guidewords = "查看视频";

	unsigned int cookie = 0;
	ipcamera_send_video_msg(path, thumb, &ipcamera_extra_msg, &cookie);
	printf("====================cookie == %d ===================\n", cookie);
}

void on_shutdown(int errcode)
{
    printf("on_shutdown\n");

    g_device_down = true;
}

int  on_set_definition(int definition ,char*  cur_definition,int cur_definition_len)
{
	PRINTF_FUNC()
	printf("on_set_definition:%d-------------------------------------------------------------\n",definition);
	strcpy(cur_definition,"hello");
	printf("%s!!\n",cur_definition);
	return  1;
}

int on_control_rotate(int rotate_direction, int rotate_degree)
{
	PRINTF_FUNC()
	printf("on_control_rotate:::::%d::::%d----------------------------------------------------\n",rotate_direction,rotate_degree);
	return 1;
}

void on_ipcamera_send_alarm_msg_complete(const unsigned int cookie, int err_code)
{
	PRINTF_FUNC()
	printf("==========================on_ipcamera_send_alarm_msg_complete============================\n");
	printf("cookie %d, err_cod %d\n", cookie, err_code);
	printf("===============================================================================\n");
}

void on_ipcamera_send_video_msg_complete(const unsigned int cookie, int err_code)
{
	PRINTF_FUNC()
	printf("==========================on_ipcamera_send_video_msg_complete============================\n");
	printf("cookie %d, err_cod %d\n", cookie, err_code);
	printf("===============================================================================\n");
}

void on_ipcamera_send_audio_msg_complete(const unsigned int cookie, int err_code)
{
	PRINTF_FUNC()
	printf("==========================on_ipcamera_send_audio_msg_complete============================\n");
	printf("cookie %d, err_cod %d\n", cookie, err_code);
	printf("===============================================================================\n");
}

void log_func(int level, const char* module, int line, const char* message)
{
	printf("%s\t%d\t%s\n", module, line, message);
	//return;
	if (level == 1)
	{
	    FILE * file = fopen("./log", "aw+");
	    if (file)
	    {
	    	fprintf(file, "%s\t%d\t%s\n", module, line, message);
	        fclose(file);
	    }
	}
}

bool readBufferFromFile(char *pPath, unsigned char *pBuffer, int nInSize, int *pSizeUsed)
{
	if (!pPath || !pBuffer)
	{
		return false;
	}

	int uLen = 0;
	FILE * file = fopen(pPath, "rb");
	if (!file)
	{
	    return false;
	}

	do
	{
	    fseek(file, 0L, SEEK_END);
	    uLen = ftell(file);
	    fseek(file, 0L, SEEK_SET);

	    if (0 == uLen || uLen > nInSize)
	    {
	    	printf("invalide file or buffer size is too small...\n");
	        break;
	    }

	    *pSizeUsed = fread(pBuffer, 1, uLen, file);

	    fclose(file);
	    return true;

	}while(0);

    fclose(file);
	return false;
}

void* thread_func_initdevice(void * arg)
{
	tx_device_info info = {0};
    info.device_name        = (unsigned char*) "smart_mug_1";
    info.device_name_len    = strlen((char*)info.device_name);
    info.device_type        = (unsigned char*) "camera";
    info.device_type_len    = strlen((char*)info.device_type);

    //1000000004  8393f1cfc377adbcb15de6fd6c87f28c  vstar
    //1000000005  dbd0124d3283e0658e96e6749d119daa  allwinner
    //1000000006  de210d75dec1bbfba4f0dc30e4279c20  dahua
    //1000000007  c54dd11f7e4abc5f15f03928b085546e  konka
    //1000000010  1d0b083d7a677f1a65de7e172d95d63e  nxp
    //info.product_id         = 1000000286;
    //info.product_secret     = (unsigned char*)"482d1d07ba04c17eddb138a762108416";
    info.product_id         = 1000000347;
    info.product_secret     = (unsigned char*)"01ecc3acf4e9b1fbee8c1849791c69ac";
    info.product_secret_len = strlen((char*)info.product_secret);

    unsigned char license[256] = {0};
    int nLicenseSize = 0;
    if (!readBufferFromFile("./licence.sign.file.txt", license, sizeof(license), &nLicenseSize))
    {
    	printf(c_CharColor_Red"[error]get license from file failed..."c_Print_Ctrl_Off"\n");
    	return NULL;
    }

    unsigned char guid[32] = {0};
    int nGUIDSize = 0;
    if(!readBufferFromFile("./GUID_file.txt", guid, sizeof(guid), &nGUIDSize))
    {
        printf(c_CharColor_Red"[error]get guid from file failed..."c_Print_Ctrl_Off"\n");
        return NULL;
    }

    info.device_license        = license;
    info.device_license_len    = nLicenseSize;
    info.device_serial_number  = (unsigned char*) guid;
    info.device_serial_number_len = nGUIDSize;

    tx_device_notify notify = {0};
    notify.on_login_complete       = on_login_complete;
    notify.on_online_status        = on_online_status;
    notify.on_shutdown             = on_shutdown;
    notify.on_binder_list_change = on_binder_list_change;

    tx_ipcamera_notify ipcamera_notify = {0};
    ipcamera_notify.on_control_rotate = on_control_rotate;
    ipcamera_notify.on_set_definition = on_set_definition;
    ipcamera_notify.on_ipcamera_send_alarm_msg_complete = on_ipcamera_send_alarm_msg_complete;
    ipcamera_notify.on_ipcamera_send_audio_msg_complete = on_ipcamera_send_audio_msg_complete;
    ipcamera_notify.on_ipcamera_send_video_msg_complete = on_ipcamera_send_video_msg_complete;

    tx_init_path init_path = {0};
    init_path.system_path = "./";
    init_path.system_path_capicity  = 10240;
    init_path.app_path = "./";
    init_path.app_path_capicity  = 1024000;
    init_path.temp_path = "./";
    init_path.temp_path_capicity  = 102400;

    tx_set_log_func(log_func);

	int ret = tx_init_device(&info, &notify, &init_path);
	if (err_null == ret)
	{
		printf("tx_init_device success\n");
	}
	else
	{
		printf("tx_init_device failed [%d]\n", ret);
	}

if( err_null == ret)
{
	ipcamera_set_callback(&ipcamera_notify);
}


    tx_msg_notify msgNotify = {0};
    msgNotify.on_receive_ccmsg = on_receive_ccmsg;
    tx_init_msg(&msgNotify);

    tx_open_platform_notify openPlatformNotify = {0};
    openPlatformNotify.on_receive_data_point = OnReceiveDataPoint;
    tx_init_open_platform(&openPlatformNotify);

    tx_file_transfer_notify fileTransferNotify = {0};

    fileTransferNotify.on_transfer_complete = ontransfercomplete;
    fileTransferNotify.on_transfer_progress = ontransferprogress;
    fileTransferNotify.on_file_in_come = onrecvfile;

    tx_init_file_transfer(fileTransferNotify, "./recv/");

	return NULL;
}

bool initdevice()
{
	pthread_t ntid = 0;
	int err;
	err = pthread_create(&ntid, NULL, thread_func_initdevice, NULL);
	if(err == 0 && ntid != 0)
	{
        pthread_join(ntid,NULL);
        ntid = 0;
    }

    return true;
}

#ifdef  SMART_LINK

#include <pcap.h>
#include <time.h>
#include <signal.h>
#include "TXSmartLink.h"
#define MAX_PACKET_LEN 65535

static pcap_t* device = NULL;
static bool net_state = true;

void on_smartlink_notify (tx_wifi_sync_param *pSmartlinkParam, void* pUserData)
{

	PRINTF_FUNC();

	if(!pSmartlinkParam)
		return;

//	union sigval mysigval;
//
//	mysigval.sival_ptr = (void*) device;
//	sigqueue(getpid(),SIGUSR1,mysigval);
    
//    pcap_breakloop(device);
	printf("ssid:%s,",pSmartlinkParam->szrouterssid);
	printf("psword:%s\n",pSmartlinkParam->szrouterpswd);
	/****
	 * 拿到wifi信息 设置网络
	 */
	net_state = true;
	return;

	/****
	 * 其他情况
	 */
	net_state = false;
	return;
}

void process_packet(u_char * arg, const struct pcap_pkthdr * pkthdr, const u_char * packet)
{
////////////////////////////////打印抓包结果//////////////////////////////////////
    printf("capture number of bytes : %d\n", pkthdr->caplen);
    printf("Received time: %s\n", ctime((const time_t *)&pkthdr->ts.tv_sec));
///////////////////////////////抓包处理/////////////////////////////////////////
    unsigned short offset = *(unsigned short*)(packet + 2);
    printf("Qos offset %u\n", offset);
    fill_80211_frame(packet,pkthdr->len, offset);
}

void stop_pcap_loop_hanlder(int signo, siginfo_t *info,void *ctx)
{
    PRINTF_FUNC();
		if(info->si_value.sival_ptr != NULL)
			pcap_breakloop((pcap_t*)(info->si_value.sival_ptr));
}

void smart_link()
{
	char  err_buf[PCAP_ERRBUF_SIZE] = {0};
	char*  devStr = NULL;
	pcap_if_t* alldevice = NULL;

	if(pcap_findalldevs(&alldevice,err_buf) == 0)
	{
		while(alldevice != NULL)
		{
			char*  temp_device = alldevice->name;
			printf("one device is :%s\n",temp_device);
            

            
			device = pcap_create(temp_device, err_buf);
            printf("device %p\n", device);
			if(!device)
				continue;
            
            
            int rfRet = pcap_can_set_rfmon(device);
            printf("pcap_can_set_rfmon: %d\n", rfRet);
            
            if (rfRet == 1)
            {
                rfRet = pcap_set_rfmon(device, DLT_IEEE802_11_RADIO_AVS);
                printf("pcap_set_rfmon: %d \n", rfRet);
            }
            
            rfRet = pcap_activate(device);
            printf("pcap_activate: %d\n", rfRet);

			int data_link = pcap_datalink(device);
            printf("data_link is : %d\n",data_link);
			//找到第一个接受无线广播信号的设备
			if(data_link == DLT_IEEE802_11_RADIO_AVS || data_link == DLT_IEEE802_11 || data_link == DLT_IEEE802_11_RADIO )
				break;
			else
			{
				pcap_close(device);
			}
			alldevice = alldevice->next;
		}
	}

	if(!device)
	{
		printf("error : packet capture failed:%s\n",err_buf);
		return;
	}

	int ret = 0;
    while (net_state == false) {
        if ((ret = pcap_dispatch(device, -1, process_packet, NULL)) < 0)
        {
            if (ret== -1)
            {
                printf ("%s", pcap_geterr(device));
                return;
            }
        }
    }


	pcap_close(device);
	pcap_freealldevs(alldevice);
}

void smart_link_file(char* file_name)
{
		if(NULL == file_name)
			return;
	    char error_buf[PCAP_ERRBUF_SIZE];

	    device = pcap_open_offline( file_name,error_buf );

		if(NULL == device)
		{
			printf("error : packet capture failed:%s\n",error_buf);
			return;
		}

		struct sigaction action = {0};
		action.sa_flags = SA_SIGINFO;
		action.sa_sigaction = stop_pcap_loop_hanlder;
		if(sigaction(SIGUSR1,&action,NULL) < 0)
		{
			printf("error : can not start stop_pcap_loop_hanlder\n!");
			return;
		}
		int ret = 0;
	    if ((ret = pcap_loop(device, -1, process_packet, NULL)) < 0)
	    {
	        if (ret== -1)
	        {
	            printf ("%s", pcap_geterr(device));
	            return;
	        }
	    }

		pcap_close(device);
}

#endif //SMART_LINK

int main(int argc, char* argv[])
{

#ifdef  SMART_LINK
	if(argc  >= 2 && !strcmp(argv[1],"smartlink"))
	{
		net_state=false;
		tx_wifi_sync_notify smartlink_notify = {0};
		smartlink_notify.on_wifi_sync_notify = on_smartlink_notify;
		//init_wifi_sync(&smartlink_notify, "b8065cb0-b794-46", NULL);// sn --> QQ
		init_wifi_sync(&smartlink_notify, "abcdabcdabcdabcd", NULL); //hardcode --> mydevices
	}
	if(!net_state)
	{
		printf("main:argc == 3\n");
		if (argc == 3)
			smart_link_file(argv[2]);
		else
			smart_link();
	}
    
    destory_wifi_sync();
    
    //
    usleep(100*1000);
    
	if (net_state)
#endif //SMART_LINK
		initdevice();
#ifdef  SMART_LINK
	else
		return -1;
#endif //SMART_LINK

    char input[500];
    char lastCMD[500] = {0};
    char cszUpKey[] = {0x1B, 0x5B, 0x41, 0};
    while (true)
    {
		sleep(2);
//        send_report_msg();continue;

        memset(input, 0, sizeof(input));
        scanf("%s", input);

        if(0 == strcmp(input, cszUpKey))
        {
            memset(input, 0, sizeof(input));
            memcpy(input, lastCMD, strlen(lastCMD));
        }

        memset(lastCMD, 0, sizeof(lastCMD));
        memcpy(lastCMD, input, strlen(input));

        printf(c_CharColor_Blue "your input cmd is:[" c_Print_Ctrl_Off
               c_CharColor_Purple "%s" c_Print_Ctrl_Off
               c_CharColor_Blue "]" c_Print_Ctrl_Off "\n", input);
        if (0 == strcmp(input, "quit"))
        {
            if (g_start_av_service)
            {
            	tx_stop_av_service();
            	g_start_av_service = false;
            }

            if (!g_device_down)
            {
            	tx_exit_device();
            }
            break;
        }
        else if (0 == strcmp(input, "report"))
        {
        	send_report_msg();
        }
        else if (0 == strcmp(input, "upload"))
        {
            testUpload();
        }
        else if (0 == strcmp(input, "sendalarm"))
        {
        	testSendAlarm();
        }
        else if ( 0 == strcmp(input, "sendaudio"))
        {
        	testSendAudio();
        }
        else if ( 0 == strcmp(input, "sendvideo"))
        {
        	testSendVideo();
        }
    }

    while(!g_device_down)
    {
    	usleep(200*1000);
    }

    return 0;
}
