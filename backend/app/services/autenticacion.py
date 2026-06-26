from typing import List, Optional
from ..models.usuario import Usuario

class ServicioAutenticacion:
    def __init__(self):
        pass

    def _get_memoria(self):
        from ..data.memoria import Memoria
        return Memoria()

    def iniciar_sesion(self, email: str, password: str) -> Optional[Usuario]:
        usuario = self.buscar_por_email(email)
        if usuario and usuario.get_password() == password:
            return usuario
        return None

    def buscar_por_email(self, email: str) -> Optional[Usuario]:
        for u in self._get_memoria().usuarios:
            if u.email == email:
                return u
        return None

    def registrar_usuario(self, usuario: Usuario) -> bool:
        if self.buscar_por_email(usuario.email):
            return False
        self._get_memoria().usuarios.append(usuario)
        return True

    def obtener_usuario_por_id(self, id_usuario: str) -> Optional[Usuario]:
        for u in self._get_memoria().usuarios:
            if u.id == id_usuario:
                return u
        return None
