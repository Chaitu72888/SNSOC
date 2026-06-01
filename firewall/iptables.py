import subprocess
import logging
from .base import FirewallBackend

logger = logging.getLogger(__name__)

class IptablesBackend(FirewallBackend):
    def block_ip(self, ip: str) -> None:
        try:
            cmd = f'sudo iptables -A INPUT -s {ip} -j DROP'
            subprocess.run(cmd, shell=True, check=False)
            logger.info(f"Firewall rule added for {ip} via iptables")
        except Exception as e:
            logger.error(f"Firewall block failed: {e}")

    def unblock_ip(self, ip: str) -> None:
        try:
            cmd = f'sudo iptables -D INPUT -s {ip} -j DROP'
            subprocess.run(cmd, shell=True, check=False)
            logger.info(f"Firewall rule deleted for {ip} via iptables")
        except Exception as e:
            logger.error(f"Firewall unblock failed: {e}")
