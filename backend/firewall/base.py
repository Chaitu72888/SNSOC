from abc import ABC, abstractmethod

class FirewallBackend(ABC):
    @abstractmethod
    def block_ip(self, ip: str) -> None:
        pass

    @abstractmethod
    def unblock_ip(self, ip: str) -> None:
        pass
