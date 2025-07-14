# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI pool app for js based luci
LUCI_DEPENDS:=+luci-base +coreutils-timeout +netcat +coreutils-date
LUCI_PKGARCH:=all

PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=Andreas Brau <pool@1688pool.com>, \
	Duncan Hill <github.com@1688pool.com>

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
