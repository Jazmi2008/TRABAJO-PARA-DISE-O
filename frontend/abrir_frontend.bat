@echo off
cd /d %~dp0
echo Abriendo MediCitas Frontend en http://127.0.0.1:5500
echo Si no se abre solo, copia esa direccion en tu navegador.
start http://127.0.0.1:5500
python -m http.server 5500
pause
