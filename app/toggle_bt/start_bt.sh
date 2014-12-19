#!/bin/sh
C=1
SDP_CMD="sdptool add --channel=$C SP"
RFCOMM_CMD="rfcomm listen $C"
TTY_CMD="agetty -a root rfcomm$C 115200 vt102"
DEV="/dev/rfcomm1"

# register serial port profile
hciconfig hci0 up
sdptool browse local | grep "Serial Port"
if [ "$?" != "0" ]; then
  echo $SDP_CMD
  $SDP_CMD &
else
  echo "rfcomm$C is alive"
fi

# check whether it is secure tty 
grep "rfcomm$C" /etc/securetty 
if [ "$?" != "0" ]; then
  echo "add rfcomm$C to /etc/securetty"
  echo "rfcomm$C" >> /etc/securetty
else
  echo "rfcomm$C is secure"
fi

# start rfcomm
ps | grep rfcomm | grep "listen $C" 
if [ "$?" != "0" ]; then
  echo $RFCOMM_CMD 
  $RFCOMM_CMD &
else
  echo "has been waiting for rfcomm$C"
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

