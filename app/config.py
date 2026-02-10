from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "IRALINK Agency Watch API"
    database_url: str = "sqlite:///./app.db"

    oidc_provider: str = Field(default="auth0")
    oidc_issuer: str = "https://example.auth0.com/"
    oidc_audience: str = "api://iralink-agency-watch"
    oidc_jwks_url: str | None = None

    rate_limit_default: str = "100/minute"

    encryption_key: str = "gJCi3NsJ9pyxB2S8V2Xfgt2EE3L2Hj0IxMmSEvTdQ70="
    audit_retention_days: int = 365


settings = Settings()
