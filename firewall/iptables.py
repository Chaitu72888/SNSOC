import subprocess
import logging
import ipaddress
from .base import FirewallBackend

logger = logging.getLogger(__name__)

class IptablesBackend(FirewallBackend):
    def block_ip(self, ip: str) -> None:
        try:
            ipaddress.ip_address(ip)
            cmd = ['sudo', 'iptables', '-A', 'INPUT', '-s', ip, '-j', 'DROP']
            subprocess.run(cmd, check=False)
            logger.info(f"Firewall rule added for {ip} via iptables")
        except ValueError:
            logger.error(f"Invalid IP address format for firewall block: {ip}")
        except Exception as e:
            logger.error(f"Firewall block failed: {e}")

    def unblock_ip(self, ip: str) -> None:
        try:
            ipaddress.ip_address(ip)
            cmd = ['sudo', 'iptables', '-D', 'INPUT', '-s', ip, '-j', 'DROP']
            subprocess.run(cmd, check=False)
            logger.info(f"Firewall rule deleted for {ip} via iptables")
        except ValueError:
            logger.error(f"Invalid IP address format for firewall unblock: {ip}")
        except Exception as e:
            logger.error(f"Firewall unblock failed: {e}")

