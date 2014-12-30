#include "stdlib.h"
#include "stdio.h"
#include "string.h"
#include "pthread.h"
#include "TXDeviceSDK.h"
#include "TXAudioVideo.h"
#include "ipcamera.h"
#include "TXSmartLink.h"
#include <unistd.h>

int initdevice(tx_device_info info, tx_device_notify notify, tx_init_path init_path) {
    tx_device_info info = {0};
    info.device_name        = (unsigned char*) "SmartMug_1";
    info.device_name_len    = strlen((char*)info.device_name);
    info.device_type        = (unsigned char*) "camera";
    info.device_type_len    = strlen((char*)info.device_type);

    //1000000004  8393f1cfc377adbcb15de6fd6c87f28c  vstar
    //1000000005  dbd0124d3283e0658e96e6749d119daa  allwinner
    //1000000006  de210d75dec1bbfba4f0dc30e4279c20  dahua
    //1000000007  c54dd11f7e4abc5f15f03928b085546e  konka
    //1000000010  1d0b083d7a677f1a65de7e172d95d63e  nxp
    info.product_id         = 1000000293;
    info.product_secret     = (unsigned char*)"41223d0ba9701c0085144066a3482c3a";
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
    printf("nGUIDSize=%d\n", nGUIDSize);
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

int main(int argc, char* argv[])
{

    initdevice();

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
