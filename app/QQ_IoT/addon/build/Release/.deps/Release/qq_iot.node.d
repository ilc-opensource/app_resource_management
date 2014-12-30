cmd_Release/qq_iot.node := ln -f "Release/obj.target/qq_iot.node" "Release/qq_iot.node" 2>/dev/null || (rm -rf "Release/qq_iot.node" && cp -af "Release/obj.target/qq_iot.node" "Release/qq_iot.node")
