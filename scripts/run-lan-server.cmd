@echo off
setlocal
cd /d "%~dp0.."
call node_modules\.bin\next.cmd start --hostname 0.0.0.0 --port 3017
