@echo off
REM ==========================================================
REM  Event Calendar 3D - one-click setup for Windows
REM  1. Checks Node.js is installed
REM  2. Installs all dependencies (npm install)
REM  3. Starts the backend server (MongoDB / fallback built-in)
REM  4. Opens the website in your browser
REM ==========================================================
cd /d "%~dp0"
title Event Calendar 3D

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is NOT installed on this PC.
  echo Opening the Node.js download page - install the LTS version, then run this file again.
  start https://nodejs.org
  pause
  exit /b
)

echo Installing dependencies, please wait...
call npm install
if errorlevel 1 (
  echo npm install failed. Check your internet connection and try again.
  pause
  exit /b
)

echo Starting the server - your browser will open in a few seconds...
start "" /min cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm start
pause
