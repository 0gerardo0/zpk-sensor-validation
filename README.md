# Tesis: Validación de Sensores con ZKP

**Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero**

## Objetivo Principal
Desarrollar un sistema que valide datos de sensores Arduino usando pruebas de conocimiento cero (ZKP), manteniendo la privacidad de las mediciones mientras garantiza su integridad.

## Estado Actual: Configuración del Entorno
- [x] Entorno de desarrollo configurado
- [ ] Revisión de literatura ZKP iniciada
- [ ] Primeros circuitos ZKP implementados
- [ ] Integración básica con Arduino

## Arquitectura del Sistema Propuesto

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Arduino MEGA  │ -> │  Generador ZKP   │ -> │   Validador     │
│  (Sensor DHT22) │    │  (Circom/Halo2)  │    │ (Verificación)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Configuración Rápida

### Prerrequisitos
- **Hardware**: Arduino MEGA 2560, sensor DHT22/AM2302
- **Software**: Arch Linux, Python 3.9+, Node.js 18+, Arduino CLI
- **Herramientas ZKP**: Circom, SnarkJS

### Instalación
```bash
git clone git@github.com:0gerardo0/zpk-sensor-validation.git
cd zkp-validacion-sensores-tesis

./herramientas/scripts/check-env.sh

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```


## Metodología de Investigación

Este proyecto sigue una **metodología de investigación aplicada** que combina:

- **Análisis Teórico**: Revisión exhaustiva de literatura en ZKP, criptografía aplicada e IoT security

## Resultados Esperados

- **Prototipo Funcional**: Sistema completo de validación ZKP para sensores IoT
- **Benchmarks Comparativos**: Análisis de rendimiento vs métodos tradicionales
- **Análisis de Seguridad**: Evaluación formal del protocolo criptográfico propuesto


- **Documentación ZKP**: [Circom Documentation](https://docs.circom.io/)
- **Arduino Referencias**: [Arduino Reference](https://www.arduino.cc/reference/)
- **Literatura Base**: Ver `documentos/fase1/referencias-bibliografia.md`

## Licencia

Este proyecto de tesis está bajo Licencia MIT. Ver archivo `LICENSE` para más detalles.

