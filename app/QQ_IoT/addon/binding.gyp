{
  "targets": [
    {
      "target_name": "qq_iot",
      "sources": [ "qq_iot.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
