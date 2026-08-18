from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url_engine: str = "postgresql://bi_admin:bi_local_dev_pw@localhost:5432/bi_platform"
    redis_url: str = "redis://localhost:6379"
    engine_port: int = 8000

    anthropic_api_key: str = ""
    ai_cheap_model: str = "claude-haiku-4-5-20251001"
    ai_capable_model: str = "claude-sonnet-5"

    credentials_encryption_key: str = "change_me_32_byte_key_for_dev_only"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "alerts@bi-ai-platform.local"


settings = Settings()
