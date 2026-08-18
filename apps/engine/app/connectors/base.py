from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Iterator, Optional


@dataclass
class Record:
    entity: str
    external_id: str
    data: dict[str, Any]


class Connector(ABC):
    """
    One implementation per source type (Postgres, MySQL, CSV, generic REST API...).
    `config` holds non-secret settings (host, query, field mapping); `credentials`
    is whatever the vault decrypted for this connection (password, API key, ...).
    Extraction is a plain generator so the ETL pipeline can stream + upsert in
    batches instead of holding an entire client dataset in memory.
    """

    @abstractmethod
    def test_connection(self, config: dict, credentials: dict) -> tuple[bool, str]:
        """Returns (ok, message)."""

    @abstractmethod
    def extract(
        self, config: dict, credentials: dict, since: Optional[str] = None
    ) -> Iterator[Record]:
        """Yields Records. `since` is an ISO timestamp for incremental (CDC-lite) pulls."""
