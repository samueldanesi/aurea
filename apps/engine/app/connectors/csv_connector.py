import csv
import io
from typing import Iterator, Optional

import requests

from .base import Connector, Record


class CsvConnector(Connector):
    """
    Fallback connector for gestionali with no usable API: a scheduled/manual CSV
    export the client drops at a URL (shared drive link, S3 presigned URL, ...) or
    uploads. `config`: {source_url, entity, external_id_field, delimiter?}.
    No real CDC here -- every run re-reads the whole file, which is why this is
    positioned as a fallback rather than the primary integration path.
    """

    def test_connection(self, config: dict, credentials: dict) -> tuple[bool, str]:
        try:
            resp = requests.head(config["source_url"], timeout=10)
            return resp.status_code < 400, f"status {resp.status_code}"
        except Exception as exc:  # noqa: BLE001
            return False, str(exc)

    def extract(
        self, config: dict, credentials: dict, since: Optional[str] = None
    ) -> Iterator[Record]:
        resp = requests.get(config["source_url"], timeout=60)
        resp.raise_for_status()
        reader = csv.DictReader(
            io.StringIO(resp.text), delimiter=config.get("delimiter", ",")
        )
        for row in reader:
            external_id = str(row.get(config["external_id_field"]))
            yield Record(entity=config["entity"], external_id=external_id, data=dict(row))
