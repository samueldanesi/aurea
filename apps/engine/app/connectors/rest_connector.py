from typing import Any, Iterator, Optional

import requests

from .base import Connector, Record


def _dot_get(obj: dict, path: str) -> Any:
    current: Any = obj
    for part in path.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return None
    return current


class RestApiConnector(Connector):
    """
    The "universal connector" from the spec: talks to any REST/GraphQL API a
    proprietary gestionale exposes. `config`:
      base_url, endpoint, method ('GET'|'POST'), entity, external_id_field (dot path),
      items_path (dot path to the list in the response, '' if the response itself is the list),
      pagination: {type: 'none' | 'page', param: 'page', size_param: 'per_page', page_size: 100, max_pages: 50},
      query_params: {...}, headers: {...}
    `credentials`: {auth_type: 'bearer' | 'api_key' | 'none', token, api_key_header}
    Field mapping to the platform's own vocabulary happens later, in the ETL/semantic
    layer step -- this connector's job is just to land the source's own JSON shape.
    """

    def _auth_headers(self, credentials: dict) -> dict:
        auth_type = credentials.get("auth_type", "none")
        if auth_type == "bearer":
            return {"Authorization": f"Bearer {credentials['token']}"}
        if auth_type == "api_key":
            return {credentials.get("api_key_header", "X-API-Key"): credentials["api_key"]}
        return {}

    def test_connection(self, config: dict, credentials: dict) -> tuple[bool, str]:
        try:
            resp = requests.request(
                config.get("method", "GET"),
                f"{config['base_url']}{config['endpoint']}",
                headers={**config.get("headers", {}), **self._auth_headers(credentials)},
                params=config.get("query_params", {}),
                timeout=10,
            )
            return resp.status_code < 400, f"status {resp.status_code}"
        except Exception as exc:  # noqa: BLE001
            return False, str(exc)

    def extract(
        self, config: dict, credentials: dict, since: Optional[str] = None
    ) -> Iterator[Record]:
        pagination = config.get("pagination", {"type": "none"})
        headers = {**config.get("headers", {}), **self._auth_headers(credentials)}
        params = dict(config.get("query_params", {}))
        if since:
            since_param = config.get("since_param")
            if since_param:
                params[since_param] = since

        page = 1
        max_pages = pagination.get("max_pages", 1) if pagination["type"] == "page" else 1

        while page <= max_pages:
            if pagination["type"] == "page":
                params[pagination.get("param", "page")] = page
                if pagination.get("size_param"):
                    params[pagination["size_param"]] = pagination.get("page_size", 100)

            resp = requests.request(
                config.get("method", "GET"),
                f"{config['base_url']}{config['endpoint']}",
                headers=headers,
                params=params,
                timeout=30,
            )
            resp.raise_for_status()
            payload = resp.json()

            items_path = config.get("items_path", "")
            items = _dot_get(payload, items_path) if items_path else payload
            if not isinstance(items, list) or len(items) == 0:
                break

            for item in items:
                external_id = str(_dot_get(item, config["external_id_field"]))
                yield Record(entity=config["entity"], external_id=external_id, data=item)

            if pagination["type"] != "page" or len(items) < pagination.get("page_size", 100):
                break
            page += 1
