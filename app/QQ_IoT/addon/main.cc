#include <nan.h>
#include <qqIot.h>

using namespace v8;

NAN_METHOD(tx_init_device) {
  NanScope();

  //NanReturnValue(NanNew("In addon"));

  if (args.Length() < 3) {
    NanReturnValue(NanNew("Wrong number of arguments"));
  }
  Local<Object> arg0 = args[0]->ToObject();
  Local<Object> arg1 = args[1]->ToObject();
  Local<Object> arg2 = args[2]->ToObject();

  tx_device_info info = {};
  info.device_name = arg0->Get(v8::String::New("device_name"))->ToString();
  
  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    NanThrowTypeError("Wrong arguments");
    NanReturnUndefined();
  }

  double arg0 = args[0]->NumberValue();
  double arg1 = args[1]->NumberValue();
  Local<Number> num = NanNew(arg0 + arg1);

  NanReturnValue(NanNew("world"));
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
