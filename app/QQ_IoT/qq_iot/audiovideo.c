#include "audiovideo.h"


#include "stdio.h"
#include "pthread.h"
#include "stdlib.h"
#include "stdio.h"
#include "unistd.h"
#include <sys/time.h>
#include <string.h>

#if defined(SILK_CODEC)
#include "SKP_Silk_SDK_API.h"
#elif defined(AMR_CODEC)
#include "interf_enc.h"
#endif

#include "audio_format_convert.h"

#define AUDIO_FILE  "./2C-16bit-16000.pcm"

static pthread_t thread_enc_id = 0;

static unsigned long s_dwTotalFrameIndex = 0;


static FILE *fstream = NULL;

static char* s_cData = NULL;
static bool s_bstart = false;

unsigned long _GetTickCount()
{
    struct timeval current = {0};
	gettimeofday(&current, NULL);
	return (current.tv_sec*1000 + current.tv_usec/1000);
}

static void* EncoderThread(void* pThreadData)
{
	while(s_bstart)
	{
		if(s_bstart){
		//printf("\n\nEncoderThread\n\n");
		if(fstream &&!feof(fstream))
		{
			int iLen = 0;
			int iType = -1;
			fread(&iLen, 1, 4, fstream);
			fread(&iType, 1, 4, fstream);
			//printf("\n\niLen = %d iType = %d\n\n", iLen, iType);
			if (iLen > 0)
			{
				fread(s_cData, 1, iLen, fstream);

				static int s_nFrameIndex = 0;
				static int s_gopIndex = -1;

				unsigned char * pcEncData = (unsigned char *)s_cData;
				int nEncDataLen = iLen;
				int nFrameType = 1;
				if(iType == 0)
				{
					s_nFrameIndex = 0;
					s_gopIndex++;
					nFrameType = 0;
				}
				else
				{
					s_nFrameIndex++;
					nFrameType = 1;
				}

				if(s_gopIndex == -1)
				{
					printf("No I Frame s_gopIndex == -1\n");
				}
				else
				{
					if(nEncDataLen != 0)
					{
						//printf("<<<<<<<<<<<<< Send  nEncDataLen == 0 s_gopIndex = %d s_nFrameIndex = %d nFrameType = %d\n", s_gopIndex, s_nFrameIndex, nFrameType);
						tx_set_video_data(pcEncData, nEncDataLen, nFrameType, _GetTickCount(), s_gopIndex, s_nFrameIndex, s_dwTotalFrameIndex++, 40);
					}
				}
			}
		}
		else if(fstream && feof(fstream))
		{
			fclose(fstream);
			fstream = fopen("test.264", "rb");
		}
		}
		usleep(90000);//90ms
	}

    return 0;
}

bool file_start_camera(int bit_rate)
{
	if(fstream == NULL)
	{
		fstream = fopen("test.264", "rb");
	}

	if(s_cData == NULL)
	{
		s_cData = malloc(1280*720);
	}
	
	if(fstream == NULL || s_cData == NULL)
	{
		return false;
	}
	
	s_bstart = true;
	int err = pthread_create(&thread_enc_id, NULL, EncoderThread, NULL);
	if (err || !thread_enc_id) 
	{
		s_bstart = false;
		return false;
	}	
	
	//s_bstart = true;
    return true;
}

bool file_stop_camera()
{
	s_bstart = false;
	if(fstream != NULL)
	{
		fclose(fstream);
		fstream = NULL;
	}

	if(s_cData != NULL)
	{
		free(s_cData);
		s_cData = NULL;
	}
	
	if(thread_enc_id !=0)
	{                 
        pthread_join(thread_enc_id,NULL);
        thread_enc_id = 0;
    }
    return true;
}

bool file_set_bitrate(int bit_rate)
{
    printf("###### SHARP SET BITRATE ###################################### %d \n", bit_rate);
	return true;
}

bool file_restart_gop()
{
	printf("###### SHARP RESTART GOP ###################################### \n");
    return true;
}


bool g_exit_audio_thread = false;
static pthread_t ntid_audio = 0;


////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
#define MAX_BYTES_ENC_PER_FRAME     250 // Equals peak bitrate of 100 kbps   
#define MAX_BYTES_DEC_PER_FRAME     1024  
  
#define MAX_INPUT_FRAMES        5  
#define MAX_LBRR_DELAY          2  
#define MAX_FRAME_LENGTH        480  
  
#define MAX_FRAME           320  

int	g_enc_count = 0;

#if defined(SILK_CODEC)

/**
 *  SILK
 */
/* default settings */  
SKP_int   fs_kHz = 16;  
SKP_int   targetRate_bps = 20000;  
SKP_int   packetSize_ms = 20;  
SKP_int   frameSizeReadFromFile_ms = 20;  
SKP_int   packetLoss_perc = 0, smplsSinceLastPacket;  
SKP_int   INBandFec_enabled = 0, DTX_enabled = 0, quiet = 0;  

SKP_SILK_SDK_EncControlStruct encControl; // Struct for input to encoder  
SKP_int32 encSizeBytes;  
void      *psEnc;  


void* thread_func_silk(void* arg)
{
	FILE* file = fopen(AUDIO_FILE, "rb");
	if (!file)
	{
		return NULL;
	}

	fseek(file, 0L, SEEK_SET);

	
	unsigned char buffer_in[MAX_FRAME_LENGTH * MAX_INPUT_FRAMES] = {0};		// buffer pcm
	unsigned char buffer_out[MAX_BYTES_ENC_PER_FRAME * MAX_INPUT_FRAMES] = {0};	// buffer encoded silk
	int frame_size = MAX_FRAME;
	int ret = 0;
	int size = 0;
	SKP_int16 nBytes = 0;
	do
	{
		if ( 0 == g_enc_count )
			break;

		usleep(20 * 1000);

		size = fread(buffer_in, sizeof(unsigned char), frame_size, file);
		if (frame_size != size)
		{
			fseek(file, 0L, SEEK_SET);
			printf("read audio: read buffer failed!\n");
			continue;
		}
		
		nBytes = MAX_BYTES_ENC_PER_FRAME * MAX_INPUT_FRAMES;

		ret = SKP_Silk_SDK_Encode(psEnc, &encControl, buffer_in, (SKP_int16)frame_size, (SKP_uint8*)buffer_out, &nBytes);
		
		if (ret)
		{
			printf("Encode fail ret= %d\n", ret);
			break;
		}

		printf("encoded size=%d\n", nBytes);
		tx_set_audio_data(buffer_out, nBytes);

		if(feof(file))
		{
			fseek(file, 0L, SEEK_SET);
			printf("File Over!\n");
		}
	} while(!g_exit_audio_thread);

	fclose(file);

	return NULL;
}

bool init_silk_enc()
{
 /* Create Encoder */
    if(g_enc_count++ != 0)
    {
    	printf("initencoder ref=%d\n", g_enc_count);
    	return false;
    }

	int ret = 0;

    ret = SKP_Silk_SDK_Get_Encoder_Size( &encSizeBytes );
    if( ret ) {
        printf("!!!!!!!! SKP_Silk_SDK_Get_Encoder_Size returned %d\n", ret );
    }

    printf("!!!!!!!! SKP_Silk_SDK_Get_Encoder_Size size=%d\n", encSizeBytes);

    psEnc = malloc( encSizeBytes );

    if (!psEnc)
    {
    	printf("!!!!!!!! SKP_Silk_SDK_Get_Encoder_Size nomem \n");
    	return false;
    }

    /* Reset Encoder */
    ret = SKP_Silk_SDK_InitEncoder( psEnc, &encControl );
    if( ret ) {
        printf("!!!!!!!! SKP_Silk_SDK_InitEncoder returned %d\n", ret );
    }

    /* Set Encoder parameters */
    encControl.API_sampleRate           = fs_kHz * 1000;
    encControl.maxInternalSampleRate	   = fs_kHz * 1000;
    encControl.packetSize           = packetSize_ms * fs_kHz;
    encControl.packetLossPercentage = packetLoss_perc;
    encControl.useInBandFEC         = INBandFec_enabled;
    encControl.useDTX               = DTX_enabled;
    encControl.complexity           = 0;//compression;
    encControl.bitRate              = targetRate_bps;

    return true;
}

bool uninit_silk_enc()
{
    if (--g_enc_count != 0)
    {
    	printf("uninitencoder ref=%d\n", g_enc_count);
    	return false;
    }

    free(psEnc);
}


#elif defined(AMR_CODEC)
/**
 *  AMR
 */
void *amr = NULL;
int dtx = 0;
enum Mode mode = MR122;


void* thread_func_amr(void* arg)
{
	FILE* file = fopen(AUDIO_FILE, "rb");
	if (!file)
	{
		return NULL;
	}

	fseek(file, 0L, SEEK_SET);


	short buf[160];
	int inputSize = 2*160;
	unsigned char inputBuf[2*160];
	unsigned char outputBuf[500];

	int i, read, n;

	do
	{
		if (0 == g_enc_count)
			break;

		usleep(20 * 1000);

		read = fread(inputBuf, sizeof(unsigned char), inputSize, file);
		read /= 2;

		if ( read < 160 )
		{
			fseek(file, 0L, SEEK_SET);
			printf("read audio: read buffer failed!\n");
			continue;
		}

		for ( i = 0; i < 160; ++i )
		{
			const unsigned char* in = &inputBuf[2*i];
			buf[i] = in[0] | (in[1] << 8);
		}

		n = Encoder_Interface_Encode(amr, mode, buf, outputBuf, 0);

		printf("======read==%d,  n == %d,    n/read == %f \n", read*2, n, (float)n/read*1.0);

		tx_set_audio_data(outputBuf, n);

		if(feof(file))
		{
			fseek(file, 0L, SEEK_SET);
			printf("File Over!\n");
		}
	} while(!g_exit_audio_thread);

	fclose(file);

	return NULL;
}

bool init_amr_enc()
{
    if(g_enc_count++ != 0)
    {
    	printf("init_amr_enc  ref=%d\n", g_enc_count);
    	return false;
    }

	amr = Encoder_Interface_init(dtx);
	return true;
}

bool uninit_amr_enc()
{
	 if (--g_enc_count != 0)
	{
		printf("uninit_amr_enc  ref=%d\n", g_enc_count);
		return false;
	}

	Encoder_Interface_exit(amr);
	return true;
}
#endif


void* thread_func_audio(void * arg)
{
	FILE* file = fopen("test.amr", "rb");
	if (!file)
	{
		printf("====================open failed=========================\n");
		exit(-1);
	}

	fseek(file, 0L, SEEK_SET);
	unsigned char cData[32];
	fread(cData, 1, 6, file);

	unsigned char inputBuf[32];
	int amr_frame_length = buffer_amr2pcm_init(1);  // ==14
	int read;
	do
	{
		usleep(20 * 1000);

		read = fread(inputBuf, sizeof(unsigned char), amr_frame_length, file);

		if ( read != amr_frame_length )   // 一定要读取一个完整的帧
		{
			fseek(file, 0L, SEEK_SET);
			fread(cData, 1, 6, file);
			printf("read audio: read buffer failed!\n");
			continue;
		}


		tx_set_audio_data(inputBuf, amr_frame_length);

		if(feof(file))
		{
			fseek(file, 0L, SEEK_SET);
			fread(cData, 1, 6, file);
			printf("======================================File Over!===================================\n");
		}

	} while(!g_exit_audio_thread);

	fclose(file);

	return NULL;
}


bool file_start_mic()
{
	g_exit_audio_thread = false;

#if defined(SILK_CODEC)
	/*
	* init encoder create psEnc.
	*/
	if(!init_silk_enc())
	{
		printf("init_silk_enc fail!!\n");
		return false;
	}
#elif defined(AMR_CODEC)
	if(!init_amr_enc())
	{
		printf("init_amr_enc fail!!\n");
		return false;
	}
#endif


	int err;
#if defined(SILK_CODEC)
	err = pthread_create(&ntid_audio, NULL, thread_func_silk /*change with silk proc thread func*/, NULL);
#elif defined(AMR_CODEC)
	err = pthread_create(&ntid_audio, NULL, thread_func_amr /*change with amr proc thread func*/, NULL);
#else
	err = pthread_create(&ntid_audio, NULL, thread_func_audio, NULL);
#endif

	if (err != 0)
	{
		printf("start mic failed!\n");
		return false;
	}

	printf("start mic successed!\n");

    return true;
}

bool file_stop_mic()
{
	g_exit_audio_thread = true;
	if(ntid_audio != 0)
	{
        pthread_join(ntid_audio,NULL);
        ntid_audio = 0;
    }
	printf("stop mic successed!\n");

#if defined(SILK_CODEC)
	/*
	* uninit encoder free psEnc.
	*/
	if (!uninit_silk_enc())
	{
		printf("uninit_silk_enc fail\n");
		return false;
	}
#elif defined(AMR_CODEC)
	if (!uninit_amr_enc())
	{
		printf("uninit_amr_enc fail\n");
		return false;
	}
#endif

    return true;
}
