import subprocess
import logging
from .base import FirewallBackend

logger = logging.getLogger(__name__)

class NetshBackend(FirewallBackend):
    def block_ip(self, ip: str) -> None:
        try:
            cmd = f'netsh advfirewall firewall add rule name="SOC-Block_{ip}" dir=in action=block remoteip={ip}'
            subprocess.run(cmd, shell=True, check=False)
            logger.info(f"Firewall rule added for {ip} via netsh")
        except Exception as e:
            logger.error(f"Firewall block failed: {e}")

    def unblock_ip(self, ip: str) -> None:
        try:
            cmd = f'netsh advfirewall firewall delete rule name="SOC-Block_{ip}"'
            subprocess.run(cmd, shell=True, check=False)
            logger.info(f"Firewall rule deleted for {ip} via netsh")
        except Exception as e:
            logger.error(f"Firewall unblock failed: {e}")
