# Análisis de Factibilidad y Restricciones de Hardware para ZKP en Dispositivos IoT

**Autor:** Gerardo  
**Proyecto:** Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero  
**Área:** Arquitectura de Sistemas Embebidos, Seguridad IoT y Cómputo Criptográfico  

---

## 1. El Dilema del Cómputo Criptográfico en Nodos Sensores

En la literatura de seguridad para Internet de las Cosas (IoT), suele asumirse erróneamente que las primitivas criptográficas avanzadas pueden ejecutarse de manera ubicua en cualquier nodo terminal. Sin embargo, un análisis riguroso de la microarquitectura de los microcontroladores más utilizados en la industria y la academia (como la familia AVR de Microchip / Atmel y los SoC Espressif) demuestra una disparidad de órdenes de magnitud entre los requerimientos de un probador zk-SNARK y las capacidades del silicio embebido.

---

## 2. Perfil de Recursos de los Microcontroladores Objetivo

Para este proyecto de investigación se analizó el microcontrolador base del prototipo experimental, el **Arduino MEGA 2560**, junto con el **ESP32** como referencia de SoC de 32 bits de gama media:

| Parámetro Microarquitectónico | Microchip ATmega2560 (Arduino MEGA) | Espressif ESP32-WROOM-32 | Estación Gateway / Edge (PC / SBC) |
| :--- | :--- | :--- | :--- |
| **Arquitectura de CPU** | AVR 8-bit RISC (Harvard modificada) | Xtensa dual-core 32-bit LX6 | x86_64 / ARM Cortex-A72 (64-bit) |
| **Frecuencia de Reloj** | 16 MHz | 240 MHz | 1.5 GHz – 4.0 GHz |
| **Memoria SRAM (Volátil)** | **8 KB** | **520 KB** (~320 KB utilizables) | 4 GB – 32 GB LPDDR4/DDR5 |
| **Memoria Flash (Programa)** | 256 KB (8 KB para bootloader) | 4 MB – 16 MB SPI Flash | Almacenamiento NVMe / eMMC masivo |
| **Aritmética en Hardware** | Multiplicador de 8×8 bits (2 ciclos) | Multiplicador 32×32 (1 ciclo), FPU | Instrucciones AVX2 / SHA / FMA / Cripto |
| **Tensión y Consumo Típico** | 5V @ ~25–50 mA (~0.15 W) | 3.3V @ ~80–240 mA (~0.5 W) | 5V–19V @ 5 W – 65 W |

---

## 3. Demostración Cuantitativa de Inviabilidad On-MCU

La generación de una prueba Groth16 requiere dos operaciones computacionales dominantes:
1. **Multiplicación Multiescalar (*Multi-Scalar Multiplication*, MSM):**  
   Calcular $\sum_{i=1}^N s_i P_i$ donde $P_i \in \mathbb{G}_1$ o $\mathbb{G}_2$ y $s_i \in \mathbb{F}_r$. Requiere algoritmos de ventana fija (Pippenger) y miles de sumas/duplicaciones de puntos elípticos con coordenadas jacobianas o proyectivas sobre el campo primo $q$ de 254 bits.
2. **Transformada Numérica Teórica (*Number Theoretic Transform*, NTT / FFT):**  
   Multiplicar e interpolar polinomios de grado $d \ge 74$ en tiempo $O(d \log d)$. Requiere mantener en memoria intermedia vectores de coeficientes en $\mathbb{F}_r$.

### 3.1 Demanda de Memoria SRAM vs. Capacidad Disponible
* **Representación de un elemento de campo $\mathbb{F}_q$:** 254 bits $\to$ 32 bytes por escalar.
* **Coordenadas proyectivas de un punto en $\mathbb{G}_1$:** $(X, Y, Z) \to 3 \times 32\text{ bytes} = 96\text{ bytes}$.
* **Coordenadas en $\mathbb{G}_2$ (extensión $\mathbb{F}_{q^2}$):** $(X, Y, Z) \to 3 \times 64\text{ bytes} = 192\text{ bytes}$.
* **Tabla de precomputación de ventana (Pippenger con $w=4$):** Requiere instanciar decenas de acumuladores temporales de grupo.
* **Buffer de ejecución de SnarkJS / C++ Prover:** La compilación mínima del motor de evaluación del testigo junto con la estructura de la llave $zkey$ (`range_check_final.zkey` pesa ~14 KB en disco, pero en tiempo de ejecución expande matrices y vectores a más de **18 MB** de memoria en el heap).

**Colisión Inevitable:**  
El ATmega2560 dispone de un espacio de direccionamiento SRAM total de **8,192 bytes**. Almacenar un único vector de evaluación de 100 elementos de $\mathbb{G}_1$ consume:
$$100 \times 96\text{ bytes} = 9,600\text{ bytes} > 8,192\text{ bytes (Capacidad Total)}$$
Esto produce un desbordamiento catastrófico de memoria (*Stack/Heap Collision*) antes de completar la lectura del primer bloque de la relación polinomial. En el ESP32, si bien la SRAM es de 520 KB, la memoria libre contigua para asignación dinámica rara vez supera los 200 KB, resultando igualmente insuficiente para las matrices QAP completas.

### 3.2 Análisis de Tiempo de CPU y Frecuencia de Muestreo
Una sola multiplicación escalar de 256 bits sobre la curva BN128 emulada por software en una CPU de 8 bits a 16 MHz demanda aproximadamente $1.5 \times 10^7$ ciclos de reloj (~0.9 segundos por punto). Una prueba Groth16 requiere cientos de operaciones de este tipo. El tiempo de generación superaría los **3 a 5 minutos por lectura**, inutilizando el microcontrolador para tareas de control en tiempo real, disparo de alarmas o lectura periódica de variables ambientales (como el sensor DHT22, cuyo protocolo exige una ventana de refresco no menor a 2 segundos).

---

## 4. Arquitectura Desacoplada: Modelo Sensor-Edge-Verifier

Frente a la restricción física del hardware, la solución metodológica y de ingeniería adoptada desacopla funcionalmente el sistema en tres capas operativas:

```
┌────────────────────────────────┐
│      CAPA FÍSICA / SENSOR      │
│  - Microcontrolador ATmega2560 │
│  - Sensor físico DHT22 / AM2302│
│  - Adquisición de temperatura  │
│  - Cómputo ligero (HMAC/Serial)│
└────────────────┬───────────────┘
                 │
                 │ Bus Local Confiable (UART / SPI / I2C)
                 │ Lectura bruta x + Nonce + Timestamp
                 ▼
┌────────────────────────────────┐
│      CAPA EDGE / PROBING       │
│  - Pasarela Edge / PC Gateway  │
│  - Circom WASM Witness Engine  │
│  - Groth16 Prover (SnarkJS)    │
│  - Generación de π en ~20.7 ms │
│  - Descarta el dato bruto x    │
└────────────────┬───────────────┘
                 │
                 │ Red Externa Insegura (HTTP / MQTT / LoRa)
                 │ Prueba π (128 bytes) + Señales Públicas [min, max]
                 ▼
┌────────────────────────────────┐
│     CAPA AUDITORA / VERIFIER   │
│  - Backend / API Cloud / Node  │
│  - Verification Key JSON       │
│  - Pairing Check en ~6.7 ms    │
│  - Veredicto Booleano (1 / 0)  │
└────────────────────────────────┘
```

### 4.1 Justificación de Confianza y Frontera de Seguridad
1. **Frontera de Confianza Local (Sensor $\leftrightarrow$ Edge):**  
   El microcontrolador y el gateway Edge forman parte del mismo dominio físico seguro (por ejemplo, dentro del mismo gabinete industrial, tablero eléctrico o nodo local de campo). La comunicación serial se establece bajo distancias cortas protegida de interceptación física.
2. **Frontera de Desconfianza Abierta (Edge $\leftrightarrow$ Verificador Cloud):**  
   Todo el trayecto hacia el servidor de monitoreo, base de datos o terceros auditores cruza redes públicas no confiables. Aquí es donde el protocolo Zero-Knowledge actúa: **el dato bruto del sensor jamás sale de la pasarela Edge**. El servidor remoto recibe únicamente la prueba $\pi$, imposibilitando cualquier espionaje industrial, fuga de información confidencial o correlación de telemetría médica.

---

## 5. Prevención de Ataques en el Enlace Local

Para evitar ataques de inyección o repetición (*replay attacks*) en el bus serial entre el microcontrolador y el Edge Gateway, el protocolo de integración de la Fase 3 incorpora:
* **Vector de Atestación Local:** Cada trama emitida por el sensor incluye `[timestamp, nonce, valor_raw, hmac]`.
* **Firma Ligera Simétrica:** El microcontrolador calcula un HMAC-SHA256 del paquete utilizando una clave simétrica compartida únicamente con el Edge local. Esta operación consume menos de 1 KB de RAM y menos de 5 ms de CPU en el ATmega2560, satisfaciendo el perfil de recursos de un dispositivo embebido de bajo costo.
