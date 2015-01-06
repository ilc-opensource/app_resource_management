{
  "targets": [
    {
      "target_name": "qq_iot",
      "sources": [ "addon.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "libraries": [
        "-ltxdevicesdk", "-L/home/czhan25/Smart_Device/smart_mug/app_manager_mug_client/app/QQ_IoT/addon"
      ],
      "cflags_cc": ["-m32", "-march=i586"]
    }
  ]
}
