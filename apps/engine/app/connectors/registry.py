from .base import Connector
from .sql_connector import SqlConnector
from .csv_connector import CsvConnector
from .rest_connector import RestApiConnector

# connector_type values coming from app.data_connections.connector_type.
# "postgres"/"mysql"/"sqlserver"/"oracle" all route through SqlConnector,
# which branches on config["dialect"] internally.
CONNECTOR_REGISTRY: dict[str, Connector] = {
    "postgres": SqlConnector(),
    "mysql": SqlConnector(),
    "sqlserver": SqlConnector(),
    "oracle": SqlConnector(),
    "csv": CsvConnector(),
    "rest_api": RestApiConnector(),
}


def get_connector(connector_type: str) -> Connector:
    connector = CONNECTOR_REGISTRY.get(connector_type)
    if not connector:
        raise ValueError(f"Unknown connector_type: {connector_type}")
    return connector
