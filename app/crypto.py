from cryptography.fernet import Fernet
from sqlalchemy.types import String, TypeDecorator

from app.config import settings


class EncryptedPII(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._fernet = Fernet(settings.encryption_key.encode())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return self._fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return self._fernet.decrypt(value.encode()).decode()
