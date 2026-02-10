from pydantic import BaseModel, ConfigDict, Field


class TokenClaims(BaseModel):
    sub: str
    iss: str
    aud: str | list[str]
    exp: int
    iat: int | None = None
    roles: list[str] = Field(default_factory=list)


class UserProfileCreate(BaseModel):
    email: str
    full_name: str


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    email: str
    full_name: str


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_sub: str
    action: str
    resource: str
    details: str
    prev_hash: str | None
    record_hash: str
