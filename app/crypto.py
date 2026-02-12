import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _derive_fernet_key(raw_key: str) -> bytes:
    digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_fernet_key(settings.pii_encryption_key))


def encrypt_pii(value: str) -> str:
    return _fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_pii(value: str) -> str:
    return _fernet.decrypt(value.encode("utf-8")).decode("utf-8")
