import subprocess
import logging
import ipaddress
from .base import FirewallBackend

logger = logging.getLogger(__name__)

class NetshBackend(FirewallBackend):
    def block_ip(self, ip: str) -> None:
        try:
            ipaddress.ip_address(ip)
            cmd = ['netsh', 'advfirewall', 'firewall', 'add', 'rule', f'name=SOC-Block_{ip}', 'dir=in', 'action=block', f'remoteip={ip}']
            subprocess.run(cmd, check=False)
            logger.info(f"Firewall rule added for {ip} via netsh")
        except ValueError:
            logger.error(f"Invalid IP address format for firewall block: {ip}")
        except Exception as e:
            logger.error(f"Firewall block failed: {e}")

    def unblock_ip(self, ip: str) -> None:
        try:
            ipaddress.ip_address(ip)
            cmd = ['netsh', 'advfirewall', 'firewall', 'delete', 'rule', f'name=SOC-Block_{ip}']
            subprocess.run(cmd, check=False)
            logger.info(f"Firewall rule deleted for {ip} via netsh")
        except ValueError:
            logger.error(f"Invalid IP address format for firewall unblock: {ip}")
        except Exception as e:
            logger.error(f"Firewall unblock failed: {e}")

