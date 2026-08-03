#!/usr/bin/env bash
# Instalar dependencias de Python
pip install -r requirements.txt
# Instalar navegadores de Playwright y sus dependencias del sistema operativo
playwright install chromium
playwright install-deps
