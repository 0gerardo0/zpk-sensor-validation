#!/bin/bash
# Script de verificación del entorno de desarrollo ZKP

echo "🔍 Verificando entorno de desarrollo para ZKP..."
echo "=================================================="

# Función para mostrar resultado
mostrar_resultado() {
    if [ $? -eq 0 ]; then
        echo "$1: Correcto"
    else
        echo "$1: Error"
        return 1
    fi
}

# Verificar Python
echo -n "Python: "
if command -v python &> /dev/null; then
    version_python=$(python --version 2>&1)
    echo "$version_python"
    mostrar_resultado "Versión Python"
else
    echo " Python no encontrado"
    exit 1
fi

# Verificar Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    version_node=$(node --version)
    echo "$version_node"
    mostrar_resultado "Versión Node.js"
else
    echo "Node.js no encontrado"
    exit 1
fi

# Verificar NPM
echo -n "NPM: "
if command -v npm &> /dev/null; then
    version_npm=$(npm --version)
    echo "v$version_npm"
    mostrar_resultado "Versión NPM"
fi

# Verificar entorno virtual
echo "Entorno Virtual:"
if [ -d "venv" ]; then
    echo "Entorno virtual 'venv' encontrado"
else
    echo "Entorno virtual no creado aún"
    echo "Ejecutar: python -m venv venv"
fi

# Verificar Git
echo -n "Git: "
if command -v git &> /dev/null; then
    version_git=$(git --version)
    echo "$version_git"
    mostrar_resultado "Git disponible"
fi

echo "Instalar dependencias del proyecto"
