#!/bin/sh

systemctl stop wpa_supplicant

ifconfig wlan0 down
