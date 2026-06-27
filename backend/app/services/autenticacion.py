from typing import List, Optional
from ..models.usuario import Usuario, Rol
from ..models.paciente import Paciente
from ..models.doctor import Doctor

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

    def buscar_por_id(self, id_usuario: str) -> Optional[Usuario]:
        for u in self._get_memoria().usuarios:
            if u.id == id_usuario:
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

    def listar_usuarios_por_rol(self, rol: Rol) -> List[Usuario]:
        return [u for u in self._get_memoria().usuarios if u.rol == rol]

    def actualizar_usuario(self, id_usuario: str, datos: dict) -> Optional[Usuario]:
        usuario = self.buscar_por_id(id_usuario)
        if not usuario:
            return None
        if "nombre" in datos:
            usuario._nombre = datos["nombre"]
        if "email" in datos:
            if datos["email"] != usuario.email:
                existente = self.buscar_por_email(datos["email"])
                if existente and existente.id != id_usuario:
                    return None
            usuario._email = datos["email"]
        if "password" in datos:
            usuario._password = datos["password"]
        if hasattr(usuario, '_telefono') and "telefono" in datos:
            usuario._telefono = datos["telefono"]
        if hasattr(usuario, '_especialidad') and "especialidad" in datos:
            usuario._especialidad = datos["especialidad"]
        return usuario

    def eliminar_usuario(self, id_usuario: str) -> bool:
        mem = self._get_memoria()
        for i, u in enumerate(mem.usuarios):
            if u.id == id_usuario:
                if u.rol == Rol.ADMINISTRADOR and id_usuario == "A-001":
                    return False
                mem.usuarios.pop(i)
                return True
        return False

    def obtener_estadisticas(self) -> dict:
        mem = self._get_memoria()
        return {
            "total_usuarios": len(mem.usuarios),
            "doctores": len(self.listar_usuarios_por_rol(Rol.DOCTOR)),
            "pacientes": len(self.listar_usuarios_por_rol(Rol.PACIENTE)),
            "recepcionistas": len(self.listar_usuarios_por_rol(Rol.RECEPCIONISTA)),
            "administradores": len(self.listar_usuarios_por_rol(Rol.ADMINISTRADOR))
        }
