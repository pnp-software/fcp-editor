.PHONY: all sync
all:
	@echo "sync - Will upload to server."

sync:
	rsync -v -r\
		--exclude='tmp' \
		--exclude='.git*' \
		--exclude='*.patch' \
		--exclude='config.php' \
		--exclude='config_user.php' \
		. p8258320@home34821896.1and1-data.host:pnp-software.com/fwprofile/editor-5.01/
