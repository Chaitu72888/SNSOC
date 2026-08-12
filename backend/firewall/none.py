import logging
from .base import FirewallBackend

logger = logging.getLogger(__name__)

class NoneBackend(FirewallBackend):
    def block_ip(self, ip: str) -> None:
        logger.info(f"Mock Firewall: Blocked {ip}")

    def unblock_ip(self, ip: str) -> None:
        logger.info(f"Mock Firewall: Unblocked {ip}")
