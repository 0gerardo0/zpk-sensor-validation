# Evaluación Experimental, Benchmarks y Validación de Seguridad

**Autor:** Gerardo  
**Proyecto:** Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero  
**Área:** Evaluación de Rendimiento, Seguridad Criptográfica y Metodología Experimental  

---

## 1. Metodología Experimental y Entorno de Pruebas

Para dotar a la investigación del rigor cuantitativo exigido en una tesis de ingeniería, se estableció un banco de pruebas automatizado con muestreo estadístico repetido ($N = 50$ iteraciones por prueba) en condiciones térmicas y de carga de CPU controladas.

### 1.1 Especificaciones del Banco de Pruebas
* **Sistema Operativo:** Arch Linux (Kernel x86_64 6.x)
* **Entorno de Ejecución:** Node.js v20+ / SnarkJS v0.7.5
* **Compilador Circom:** Circom 2.1.9
* **Curva Criptográfica:** BN128 (alt_bn128, orden primo $r \approx 2^{254}$)
* **Parámetros del Circuito:** 74 restricciones R1CS, 2 entradas públicas, 1 entrada privada

---

## 2. Resultados de Benchmarks Cuantitativos

Se desglosó el tiempo total de ciclo de vida criptográfico en sus tres etapas fundamentales:

$$\text{Latencia Total} = T_{\text{testigo}} + T_{\text{probador}} + T_{\text{verificador}}$$

| Etapa Criptográfica | Media ($\mu$) | Desviación Estándar ($\sigma$) | Mediana ($Q_2$) | Rango Intercuartil (IQR) | Complejidad Teórica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cálculo de Testigo (*Witness*)** | 1.82 ms | $\pm$ 0.31 ms | 1.78 ms | 0.40 ms | $O(N_{\text{constraints}})$ |
| **Generación de Prueba (Groth16)** | 18.86 ms | $\pm$ 1.18 ms | 18.65 ms | 1.45 ms | $O(N \log N)$ (MSM + FFT) |
| **Verificación de Prueba (*Pairing*)**| **6.71 ms** | $\pm$ 0.76 ms | **6.64 ms** | 0.90 ms | **$O(1)$ (Constante: 3 pairings)** |
| **Pipeline Completo End-to-End** | 27.39 ms | $\pm$ 1.85 ms | 27.07 ms | 2.15 ms | — |

```
Distribución de Latencias (N=50):
  Witness:    [==] 1.8 ms
  Prover:     [====================] 18.9 ms
  Verifier:   [=======] 6.7 ms
```

### 2.1 Análisis de Huella de Memoria y Tamaño de Red

| Artefacto Criptográfico | Tamaño en Disco | Tamaño en Memoria RAM (Runtime) | Tamaño en Transmisión de Red |
| :--- | :--- | :--- | :--- |
| **Circuito R1CS (`range_check.r1cs`)** | 2.8 KB | — (Solo en compilación) | 0 bytes (No se transmite) |
| **Motor Wasm (`range_check.wasm`)** | 35.4 KB | ~1.2 MB | 0 bytes (Permanece en Edge) |
| **Llave de Prueba (`range_check_final.zkey`)** | 14.1 KB | ~18.5 MB (Expansión de matrices) | 0 bytes (Permanece en Edge) |
| **Llave de Verificación (`verification_key.json`)** | 1.8 KB | ~65 KB | Una sola vez en despliegue |
| **Prueba Criptográfica ($\pi = [A, B, C]$)** | **128 bytes** (JSON calldata: ~750 bytes) | < 2 KB | **128 bytes binarios** |
| **Señales Públicas ($[min, max]$)** | 64 bytes (2 escalares de 256 bits) | < 1 KB | 64 bytes |

---

## 3. Matriz de Validación de Seguridad y Casos de Prueba

La suite automatizada implementada en [`tests/run_tests.js`](file:///home/gerardo0/repos-github/zkp-sensor-validation-thesis/tests/run_tests.js) somete al sistema a 8 pruebas críticas de validación cruzada:

| ID | Tipo de Prueba | Vector de Entrada | Resultado Esperado | Mecanismo Criptográfico de Control | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T01** | **Completitud Nominal** | `val: 24, min: 18, max: 30` | `PASS` (Válido) | Ecuación de pairing $e(A,B) = e(\alpha,\beta) \dots$ balanceada | **Aprobado** |
| **T02** | **Frontera Inferior** | `val: 18, min: 18, max: 30` | `PASS` (Válido) | Bit de acarreo $b_n = 1$ en $D = 2^{64} + 18 - 18$ | **Aprobado** |
| **T03** | **Frontera Superior** | `val: 30, min: 18, max: 30` | `PASS` (Válido) | Bit de acarreo $b_n = 1$ en $D = 2^{64} + 30 - 30$ | **Aprobado** |
| **T04** | **Límite Cero** | `val: 0, min: 0, max: 100` | `PASS` (Válido) | Evaluación en el origen de los números naturales | **Aprobado** |
| **T05** | **Solidez (Underflow)** | `val: 17, min: 18, max: 30` | `RECHAZO` (Error) | Aserción R1CS falla en `GreaterEqThan`: $b_n = 0 \neq 1$ | **Aprobado** |
| **T06** | **Solidez (Overflow)** | `val: 31, min: 18, max: 30` | `RECHAZO` (Error) | Aserción R1CS falla en `LessEqThan`: $b_n = 0 \neq 1$ | **Aprobado** |
| **T07** | **Anti-Tampering Señal Pública** | Modificar señal de `18` a `19` | `RECHAZO` (Verify=0)| El compromiso público $X \in \mathbb{G}_1$ no calza en pairing | **Aprobado** |
| **T08** | **Anti-Tampering Prueba $\pi_a$** | Alterar coordenada $x$ de punto $A$ | `RECHAZO` (Verify=0)| El punto resultante no pertenece al subgrupo o pairing diverge | **Aprobado** |

---

## 4. Análisis Formal de Resistencia Criptográfica

### 4.1 Cota de Error de Solidez (Lema de Schwartz-Zippel)
La probabilidad de que un atacante genere un polinomio cociente $\tilde{h}(x)$ falso que coincida accidentalmente con las evaluaciones en los puntos de trampa secretos $\tau$ está rigurosamente acotada por:

$$\Pr_{\tau \leftarrow \mathbb{F}_r^*} [P(\tau) = \tilde{h}(\tau)t(\tau)] \le \frac{\deg(P)}{|\mathbb{F}_r^*|} = \frac{2d}{r - 1}$$

Dado que el grado del polinomio en nuestro circuito es $d = 74$ y el orden del campo escalar es $r \approx 2.18 \times 10^{77} \approx 2^{254}$:

$$\Pr[\text{Falsificación de Prueba}] \le \frac{148}{2^{254}} \approx 5.1 \times 10^{-75} < 2^{-128}$$

Esto demuestra que la probabilidad de que una lectura inválida (como $val = 31$) produzca una prueba que engañe al verificador es criptográficamente despreciable e inexistente para cualquier adversario computacionalmente acotado.

### 4.2 Invariabilidad ante Manipulación de Datos en Tránsito
A diferencia de los protocolos tradicionales donde la manipulación de una bandera booleana en un paquete JSON (`"is_valid": true`) puede pasar desapercibida si no hay una firma digital centralizada, en el esquema Groth16 la prueba $\pi$ está ligada algebraicamente tanto a la estructura del circuito como al vector de señales públicas $[min, max]$. Cualquier alteración en el canal de red produce el colapso inmediato de la igualdad del emparejamiento bilineal en el verificador.
