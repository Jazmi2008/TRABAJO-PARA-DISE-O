from enum import Enum
from typing import Optional

class Rol(Enum):
    DOCTOR = "DOCTOR"
    PACIENTE = "PACIENTE"
    RECEPCIONISTA = "RECEPCIONISTA"

class Usuario:
    def __init__(self, id: str, nombre: str, email: str, password: str, rol: Rol):
        self._id = id
        self._nombre = nombre
        self._email = email
        self._password = password
        self._rol = rol

    @property
    def id(self) -> str:
        return self._id

    @property
    def nombre(self) -> str:
        return self._nombre

    @property
    def email(self) -> str:
        return self._email

    @property
    def password(self) -> str:
        return self._password

    @property
    def rol(self) -> Rol:
        return self._rol

    def get_rol(self) -> Rol:
        return self._rol

    def get_email(self) -> str:
        return self._email

    def get_password(self) -> str:
        return self._password

    def to_dict(self) -> dict:
        return {
            "id": self._id,
            "nombre": self._nombre,
            "email": self._email,
            "rol": self._rol.value
        }
