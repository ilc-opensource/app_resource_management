#!/bin/sh
C=1
SDP_CMD="sdptool add --channel=$C SP"
RFCOMM_CMD="rfcomm listen $C"
TTY_CMD="agetty -a root rfcomm$C 115200 vt102"
DEV="/dev/rfcomm1"

hciconfig hci0 up
# register serial port profile
sdptool browse local | grep "Serial Port"
if [ "$?" != "0" ]; then
  echo $SDP_CMD
  $SDP_CMD &
else
  echo "rfcomm$C is alive"
fi
 
# start rfcomm
ps | grep rfcomm | grep "listen $C" 
if [ "$?" != "0" ]; then
  echo $RFCOMM_CMD 
  $RFCOMM_CMD &
else
  echo "rfcomm$C is alive"
fi

# start agetty
ps | grep agetty | grep "rfcomm$C"
if [ "$?" != "0" ]; then

  echo "waiting for $DEV..."
  while ! [ -e $DEV ]
  do
    echo "."
    sleep 1
  done
  
  echo $TTY_CMD
  $TTY_CMD &
else
  echo "agetty rfcomm$C is alive"
fi

