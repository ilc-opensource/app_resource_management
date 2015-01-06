{
  "targets": [
    {
      "target_name": "qq_iot",
      "sources": [ "addon.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
