//var addon = require('bindings')('qq_iot');
var qq_iot = require('./build/Release/qq_iot');

//console.log(addon.hello()); // 'world'

var tx_device_info = {
  device_name        : "smart_mug",
  device_type        : "liquid_container",
  product_id         : 1000000293,
  product_secret     : "41223d0ba9701c0085144066a3482c3a",
  device_license     : "304502201F696E9EF786BE2CBEC9533EA7D3CE91E9A7C41711D19313D17D9D2070079DC702210081455440F024402085ED97DDD88A24ECDC998D03DA36CECEEB28CA60F5F0249F",
  device_serial_number  :"amoudo-123456789",
};

var qq_iot_on_login_complete = function(error_code) {
};
var qq_iot_on_online_status = function(old_status, new_status) {
};
var qq_iot_on_binder_list_change = function(error_code, binderList, binderCount) {
};
var qq_iot_on_shutdown = function(error_code) {
};

var tx_device_notify = {
  on_login_complete: qq_iot_on_login_complete,
  on_online_status: qq_iot_on_online_status,
  on_shutdown: qq_iot_on_shutdown,
  on_binder_list_change: qq_iot_on_binder_list_change
};

var tx_init_path = {
  system_path : __dirname,
  system_path_capicity  : 10240,
  app_path :__dirname,
  app_path_capicity  : 1024000,
  temp_path : __dirname,
  temp_path_capicity  : 102400
};

var ret = qq_iot.tx_init_device(tx_device_info, tx_device_notify, tx_init_path);
console.log(ret);
