#!/bin/bash
INITRAMFS_CONF="/etc/initramfs-tools/update-initramfs.conf"
DPKG_TRIGGERS="/var/lib/dpkg/triggers/File"

if [ -e $INITRAMFS_CONF ]; then
    sudo sed -i 's/yes/no/g' $INITRAMFS_CONF
fi
sudo rm -f /var/lib/man-db/auto-update

if [ -e $DPKG_TRIGGERS ]; then
    sudo sed '/fontconfig/d' -i $DPKG_TRIGGERS
    sudo sed '/install-info/d' -i $DPKG_TRIGGERS
    sudo sed '/mime/d' -i $DPKG_TRIGGERS
    sudo sed '/hicolor-icon-theme/d' -i $DPKG_TRIGGERS
fi

echo "force-unsafe-io" | sudo tee -a /etc/dpkg/dpkg.cfg.d/force-unsafe-io

if [ -e /usr/bin/eatmydata ]; then
  echo "eatmydata available"
  echo -e '#!/bin/sh\nexec eatmydata /usr/bin/dpkg $@' | sudo tee /usr/local/bin/dpkg && sudo chmod +x /usr/local/bin/dpkg
  echo -e '#!/bin/sh\nexec eatmydata /usr/bin/apt $@' | sudo tee /usr/local/bin/apt && sudo chmod +x /usr/local/bin/apt
  echo -e '#!/bin/sh\nexec eatmydata /usr/bin/apt-get $@' | sudo tee /usr/local/bin/apt-get && sudo chmod +x /usr/local/bin/apt-get
fi
