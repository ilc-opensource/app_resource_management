#include "stdlib.h"
#include "stdio.h"
#include "string.h"
#include "pthread.h"
#include "TXDeviceSDK.h"
#include "TXAudioVideo.h"
#include "ipcamera.h"
#include "TXSmartLink.h"
#include <unistd.h>

#include <nan.h>
using namespace v8;

struct addon_tx_device_notify_cb {
  Local<Value> on_login_complete;
  Local<Value> on_online_status;
  Local<Value> on_shutdown;
  Local<Value> on_binder_list_change;
} callBack;

void on_login_complete(int errcode) {
  Local<Function> cb = callBack.on_login_complete;
  const unsigned argc = 1;
  Local<Value> argv[argc] = { NanNew("hello world") };
  NanMakeCallback(NanGetCurrentContext()->Global(), cb, argc, argv);
}

NAN_METHOD(tx_init_device) {
  NanScope();

  if (args.Length() < 3) {
    NanReturnValue(NanNew("Wrong number of arguments"));
  }
  Local<Object> arg0 = args[0]->ToObject();
  Local<Object> arg1 = args[1]->ToObject();
  Local<Object> arg2 = args[2]->ToObject();

  tx_device_info info = {0};
  v8::String::Utf8Value item(arg0->Get(v8::String::New("device_name"))->ToString());
  std::string from = std::string(*item);

  info.device_name = (unsigned char *)std::string(*((v8::String::Utf8Value)arg0->Get(v8::String::New("device_name"))->ToString())).c_str();
  info.device_type = (unsigned char *)std::string(*((v8::String::Utf8Value)arg0->Get(v8::String::New("device_type"))->ToString())).c_str();
  info.product_id = arg0->Get(v8::String::New("product_id"))->ToInt32()->Value();
  info.product_secret = (unsigned char *)std::string(*((v8::String::Utf8Value)arg0->Get(v8::String::New("product_secret"))->ToString())).c_str();
  info.device_license = (unsigned char *)std::string(*((v8::String::Utf8Value)arg0->Get(v8::String::New("device_license"))->ToString())).c_str();
  info.device_serial_number = (unsigned char *)std::string(*((v8::String::Utf8Value)arg0->Get(v8::String::New("device_serial_number"))->ToString())).c_str();
  
  tx_device_notify notify = {0};
  notify.on_login_complete     = on_login_complete;
  notify.on_online_status      = on_online_status;
  notify.on_shutdown           = on_shutdown;
  notify.on_binder_list_change = on_binder_list_change;
  callBack.on_login_complete = arg0->Get(v8::String::New("on_login_complete"));
  callBack.on_login_complete = arg0->Get(v8::String::New("on_online_status"));
  callBack.on_login_complete = arg0->Get(v8::String::New("on_shutdown"));
  callBack.on_login_complete = arg0->Get(v8::String::New("on_binder_list_change"));

  NanReturnValue(NanNew(info.product_id));
}

void Init(Handle<Object> exports) {
  exports->Set(NanNew("tx_init_device"), NanNew<FunctionTemplate>(tx_init_device)->GetFunction());
/*
  exports->Set(NanNew("tx_exit_device"), NanNew<FunctionTemplate>(tx_exit_device)->GetFunction());
  exports->Set(NanNew("tx_init_msg"), NanNew<FunctionTemplate>(tx_init_msg)->GetFunction());
  exports->Set(NanNew("tx_send_ccmsg"), NanNew<FunctionTemplate>(tx_send_ccmsg)->GetFunction());
  exports->Set(NanNew("tx_send_ccmsg_ex"), NanNew<FunctionTemplate>(tx_send_ccmsg_ex)->GetFunction());
  exports->Set(NanNew("tx_start_av_service"), NanNew<FunctionTemplate>(tx_start_av_service)->GetFunction());
  exports->Set(NanNew("tx_set_audio_data"), NanNew<FunctionTemplate>(tx_set_audio_data)->GetFunction());
  exports->Set(NanNew("tx_set_video_data"), NanNew<FunctionTemplate>(tx_set_video_data)->GetFunction());
  exports->Set(NanNew("tx_stop_av_service"), NanNew<FunctionTemplate>(tx_stop_av_service)->GetFunction());
  exports->Set(NanNew("tx_init_file_transfer"), NanNew<FunctionTemplate>(tx_init_file_transfer)->GetFunction());
  exports->Set(NanNew("tx_send_file_to"), NanNew<FunctionTemplate>(tx_send_file_to)->GetFunction());
  exports->Set(NanNew("tx_send_file_to_ex"), NanNew<FunctionTemplate>(tx_send_file_to_ex)->GetFunction());
*/
}

NODE_MODULE(qq_iot, Init)
