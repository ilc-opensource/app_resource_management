#!/bin/sh

touch /etc/wpa_supplicant/wpa_supplicant.conf
systemctl start wpa_supplicant

