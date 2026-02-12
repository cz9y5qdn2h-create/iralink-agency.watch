from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    oidc_issuer: str = Field(default="https://example-tenant.auth0.com/")
    oidc_audience: str = Field(default="api://iralink")
    oidc_algorithms: list[str] = Field(default_factory=lambda: ["HS256"])
    oidc_shared_secret: str = Field(default="dev-oidc-shared-secret-32-bytes-min")

    # Simulate provider selection (auth0, keycloak, cognito)
    oidc_provider: str = Field(default="auth0")

    rate_limit_requests: int = Field(default=100)
    rate_limit_window_seconds: int = Field(default=60)

    audit_log_path: str = Field(default="audit.log")
    audit_hmac_key: str = Field(default="change-me-super-secret")

    pii_encryption_key: str = Field(default="change-me-change-me-change-me-123")

    retention_days: int = Field(default=90)


settings = Settings()
