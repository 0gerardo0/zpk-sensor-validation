# Tesis: Validación de Sensores con ZKP

**Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero**

## Objetivo Principal
Desarrollar un sistema que valide datos de sensores IoT (Arduino) usando pruebas de conocimiento cero (**zk-SNARKs** con **Groth16**), garantizando la integridad y pertenencia a rangos válidos de las mediciones sin exponer los datos en crudo ni comprometer la privacidad.

---

## Roadmap del Proyecto y Estado Actual

```
[Fase 1: Fundamentos & Setup] ────────► [Fase 2: Circuitos ZKP Base] ────────► [Fase 3: Integración Hardware/IoT] ────────► [Fase 4: Pipeline & Verificación]
       (COMPLETADA)                           (EN PROGRESO / AVANZADA)                     (PENDIENTE)                                (PENDIENTE)
```

### Fase 1: Fundamentos y Entorno de Desarrollo (Completada)
- [x] Configuración de toolchain en Arch Linux: Node.js, Python, Circom 2.1+, SnarkJS, Arduino CLI.
- [x] Script de verificación de dependencias y entorno (`tools/scripts/check-env.sh`).
- [x] Definición de arquitectura base y dependencias de proyecto (`package.json`, `requirements.txt`).
- [x] Revisión de literatura y formalización teórica: Groth16, R1CS y QAP (RareSkills ZK Book, Jens Groth 2016, Vitalik QAP).

### Fase 2: Implementación de Circuitos Criptográficos ZKP (En Progreso / Avanzado)
- [x] Circuito preliminar de prueba de concepto (`src/zkp/circuits/hello-world.circom`).
- [x] Circuito de validación de rango numérico de telemetría (`src/zkp/circuits/range_check.circom`) utilizando `circomlib` (`GreaterEqThan`, `LessEqThan`).
- [x] Ceremonia de Trusted Setup (Powers of Tau de 12 bits: `tools/ptau/pot12_final.ptau`).
- [x] Generación de llaves específicas de circuito:
  - Llave del probador (Prover key: `range_check_final.zkey`).
  - Llave de verificación exportada en JSON (`src/zkp/keys/verification_key.json`).
- [ ] Scripts automatizados para generación de testigos (*witness generation* en C++ / Wasm).
- [ ] Benchmark preliminar de restricciones R1CS y tiempos de prueba en local.

### Fase 3: Integración Hardware / Sensores (Siguiente Hito)
- [ ] Lectura y calibración de mediciones físicas con Arduino MEGA 2560 y sensor DHT22/AM2302 (`src/arduino/sensor_reader/`).
- [ ] Emisión segura / canal serial de telemetría estructurada desde el microcontrolador.
- [ ] Hashing o empaquetado de payload para atestación de origen.

### Fase 4: Pipeline de Validación End-to-End
- [ ] Prover off-chain/edge: Generación de prueba ZK a partir de la lectura serial del Arduino.
- [ ] Backend Verifier: API para verificar pruebas `Groth16` mediante la `verification_key.json` sin conocer la lectura exacta.
- [ ] Registro de atestaciones válidas / métricas de integridad.

### Fase 5: Evaluación, Benchmarks y Documentación de Tesis
- [ ] Pruebas de estrés y análisis de latencia (generación vs. verificación).
- [ ] Evaluación de seguridad y resiliencia ante inyección de datos fuera de rango.
- [ ] Redacción final del documento de tesis.

---

## Arquitectura del Sistema

```
┌─────────────────┐       Lectura        ┌─────────────────────────┐       zk-SNARK        ┌────────────────────────┐
│  Arduino MEGA   │ ───────────────────► │      Generador ZKP      │ ────────────────────► │   Validador / Servidor │
│  + Sensor DHT22 │   (Serial / Hash)    │  (Circom + Prover Key)  │    (Proof + Publics)  │  (verification_key)    │
└─────────────────┘                      └─────────────────────────┘                       └────────────────────────┘
                                            - Input privado: val                              - Verifica val ∈ [min, max]
                                            - Public: min, max                                - Cero filtración de datos
```

---

## Estructura del Repositorio

```
zkp-sensor-validation-thesis/
├── docs/research/          # Referencias teóricas y notas de investigación
├── src/
│   ├── arduino/            # Firmware y scripts para lectura de sensores
│   ├── backend/            # APIs y módulos de validación y base de datos
│   ├── frontend/           # Dashboards de monitoreo visual
│   └── zkp/
│       ├── circuits/       # Circuitos Circom (hello-world, range_check)
│       ├── keys/           # Verification key y llaves zkey
│       └── prover/         # Generadores de pruebas y testigos
└── tools/
    ├── ptau/               # Ceremonia Powers of Tau (pot12_final.ptau)
    └── scripts/            # Scripts de comprobación y automatización
```

---

## Configuración Rápida

### Prerrequisitos
- **Hardware**: Arduino MEGA 2560, sensor DHT22/AM2302.
- **Software**: Arch Linux, Node.js 18+, Python 3.9+, Arduino CLI.
- **Herramientas ZKP**: Circom 2.1+, SnarkJS.

### Instalación
```bash
git clone git@github.com:0gerardo0/zpk-sensor-validation.git
cd zkp-sensor-validation-thesis

# Verificar dependencias del sistema
./tools/scripts/check-env.sh

# Configurar entorno Python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Instalar dependencias de Node.js (Circomlib, SnarkJS)
npm install
```

---

## Referencias Principales
- **Groth, J. (2016)**: *On the Size of Pairing-based Non-interactive Arguments*. [ePrint 2016/260](https://eprint.iacr.org/2016/260.pdf).
- **Iden3**: *Circom 2.0 Documentation*. [docs.circom.io](https://docs.circom.io/).
- **Vitalik Buterin (2016)**: *Quadratic Arithmetic Programs: from Zero to Hero*.
- **RareSkills (2023)**: *The RareSkills Zero Knowledge Book*. [rareskills.io/zk-book](https://www.rareskills.io/zk-book).

## Licencia
MIT License.
