var imgs = "bmp/email_1.bmp,bmp/email_2.bmp,bmp/email_3.bmp,bmp/email_4.bmp,bmp/email_5.bmp,bmp/email_6.bmp,bmp/email_7.bmp,bmp/email_8.bmp,bmp/email_9.bmp,bmp/email_10.bmp,bmp/email_11.bmp,bmp/email_12.bmp,bmp/email_13.bmp,bmp/email_14.bmp,bmp/email_15.bmp,bmp/email_16.bmp,bmp/email_17.bmp,bmp/email_18.bmp,bmp/email_19.bmp,bmp/email_20.bmp,bmp/email_21.bmp,bmp/email_22.bmp,bmp/email_23.bmp,bmp/email_24.bmp,bmp/email_25.bmp,bmp/email_26.bmp,bmp/email_27.bmp,bmp/email_28.bmp,bmp/email_29.bmp,bmp/email_30.bmp"

var IOLIB = require('../../../device');

var io = new IOLIB.IO({
  log: true,
  quickInit: false
});

var handle = io.mug_disp_init();

var disp_num = function(num) {
  var cimg = io.mug_load_cimg_handle('bmp/email_1.bmp');
  io.mug_draw_number_cimg_handle(cimg, 0, 0, num, io.CYAN);
  io.mug_disp_cimg_handle(handle, cimg);
  io.mug_destroy_cimg_handle(cimg);
}

var disp = function() {
  io.mug_disp_img_N(handle, imgs, 100);
}

exports.disp = disp;
exports.disp_num = disp_num;
