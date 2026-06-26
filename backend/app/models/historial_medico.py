from typing import List

class HistorialMedico:
    def __init__(self, id_historial: str):
        self._id_historial = id_historial
        self._diagnosticos: List[str] = []
        self._alergias: List[str] = []
        self._medicamentos: List[str] = []

    @property
    def id_historial(self) -> str:
        return self._id_historial

    @property
    def diagnosticos(self) -> List[str]:
        return self._diagnosticos

    @property
    def alergias(self) -> List[str]:
        return self._alergias

    @property
    def medicamentos(self) -> List[str]:
        return self._medicamentos

    def agregar_diagnostico(self, diagnostico: str) -> None:
        if diagnostico and diagnostico not in self._diagnosticos:
            self._diagnosticos.append(diagnostico)

    def agregar_alergia(self, alergia: str) -> None:
        if alergia and alergia not in self._alergias:
            self._alergias.append(alergia)

    def agregar_medicamento(self, medicamento: str) -> None:
        if medicamento and medicamento not in self._medicamentos:
            self._medicamentos.append(medicamento)

    def obtener_resumen(self) -> str:
        return (
            f"Historial {self._id_historial}: "
            f"Diagnosticos: {len(self._diagnosticos)}, "
            f"Alergias: {len(self._alergias)}, "
            f"Medicamentos: {len(self._medicamentos)}"
        )

    def to_dict(self) -> dict:
        return {
            "id_historial": self._id_historial,
            "diagnosticos": self._diagnosticos,
            "alergias": self._alergias,
            "medicamentos": self._medicamentos
        }
