# Diseño y Verificación Formal del Circuito Criptográfico RangeCheck

**Autor:** Gerardo  
**Proyecto:** Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero  
**Área:** Criptografía Aplicada, Lenguajes Específicos de Dominio (Circom) y Verificación Aritmética  

---

## 1. Planteamiento del Problema en Aritmética Modular

El objetivo criptográfico del circuito es validar que una medición física privada $val$ se encuentra comprendida estrictamente dentro de un intervalo cerrado definido por dos cotas públicas $[min, max]$:

$$min \le val \le max$$

En un modelo computacional convencional de CPU (x86, ARM, RISC-V), una comparación de rango se resuelve mediante una sola instrucción de resta y evaluación de la bandera de acarreo/signo (`CMP`, `JGE`, `JLE`). 

Sin embargo, en criptografía de conocimiento cero basada en curvas elípticas, **todos los cálculos se ejecutan sobre un campo finito $\mathbb{F}_r$** con aritmética módulo $r$, donde:

$$r = 21888242871839275222246405745257275088548364400416034343698204186575808495617$$

En un campo finito $\mathbb{F}_r$ no existe un ordenamiento natural canónico: la relación de orden $<$ no es compatible con la estructura de campo. Si un valor fuera negativo en aritmética entera (por ejemplo $-1$), en $\mathbb{F}_r$ se representa como:

$$-1 \equiv r - 1 = 21888242871839275222246405745257275088548364400416034343698204186575808495616$$

Un número módulo $r$ de magnitud colosal ($> 10^{76}$) aparentaría ser mayor que cualquier cota positiva si se evaluara como un escalar no signado sin restricciones. Por consiguiente, para implementar desigualdades seguras en Circom es **obligatorio restringir los valores a una representación de longitud de bits fija**.

---

## 2. Arquitectura del Circuito en Circom

El circuito está codificado en [`src/zkp/circuits/range_check.circom`](file:///home/gerardo0/repos-github/zkp-sensor-validation-thesis/src/zkp/circuits/range_check.circom):

```circom
pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template RangeCheck() {
    // Entradas Públicas: Definidas por el sistema o política de auditoría
    signal input min;
    signal input max;

    // Entrada Privada: Lectura física del sensor
    signal input val;

    // Comparador 1: val >= min  <=>  GreaterEqThan(64)
    component ge = GreaterEqThan(64);
    ge.in[0] <== val;
    ge.in[1] <== min;
    ge.out === 1;

    // Comparador 2: val <= max  <=>  LessEqThan(64)
    component le = LessEqThan(64);
    le.in[0] <== val;
    le.in[1] <== max;
    le.out === 1;
}

component main {public [min, max]} = RangeCheck();
```

### 2.1 Descomposición en Bits (`Num2Bits`)
Los componentes `GreaterEqThan(n)` y `LessEqThan(n)` de la biblioteca estándar `circomlib` resuelven la comparación mediante el algoritmo de diferencia desplazada:

Para verificar si $A \ge B$ en $n$ bits:
1. Se computa la diferencia escalada:
   $$D = 2^n + A - B$$
2. Se descompone $D$ en su representación binaria de $n + 1$ bits mediante el sub-template `Num2Bits(n + 1)`:
   $$D = \sum_{j=0}^n b_j \cdot 2^j, \quad \text{donde } b_j \in \{0, 1\}$$
3. Cada bit $b_j$ se fuerza a ser booleano mediante la restricción cuadrática canónica:
   $$b_j \cdot (1 - b_j) = 0$$
4. El bit más significativo $b_n$ (el bit de acarreo / signo desplazado) determina el resultado de la comparación:
   * Si $A \ge B$, entonces $2^n + (A - B) \ge 2^n$, por lo que $b_n = 1$.
   * Si $A < B$, entonces $2^n + (A - B) < 2^n$, por lo que $b_n = 0$.

Al exigir que `ge.out === 1` y `le.out === 1`, el compilador fuerza que ambos bits más significativos sean idénticamente 1, garantizando simultáneamente que:
$$val - min \ge 0 \quad \land \quad max - val \ge 0$$

---

## 3. Auditoría de Restricciones R1CS

Al compilar el circuito con `circom range_check.circom --r1cs --wasm --sym`, el compilador genera la siguiente distribución exacta de complejidad:

* **Plantillas instanciadas:** 5 (RangeCheck, GreaterEqThan, LessEqThan, CompConstant, Num2Bits).
* **Restricciones lineales y no lineales:**
  * **Restricciones cuadráticas R1CS ($A \cdot B = C$):** Exactamente **74 restricciones**.
  * **Señales públicas:** 2 (`min`, `max`).
  * **Señales privadas:** 1 (`val`).
  * **Señales internas:** 71 señales intermedias correspondientes a los bits de descomposición de los comparadores.

### 3.1 Desglose de las 74 Restricciones
* **65 restricciones de booleanidad:** $b_j \cdot (1 - b_j) = 0$ para cada bit de la descomposición binaria del valor desplazado de 64 bits.
* **1 restricción de suma ponderada:** Comprobación de que $\sum b_j 2^j$ coincide con la señal de entrada combinada.
* **8 restricciones auxiliares de normalización de rango:** Verificación de consistencia entre los dos comparadores en paralelo.

Esta reducida huella de 74 restricciones es extraordinariamente eficiente comparada con circuitos de funciones hash (por ejemplo, SHA-256 en Circom consume más de 25,000 restricciones). Esto explica que la generación de la prueba se complete en apenas ~20 milisegundos en el Edge Gateway.

---

## 4. Ceremonia de Configuración de Confianza (Trusted Setup)

Para el protocolo Groth16, el esquema de prueba requiere parámetros generados en un proceso de configuración de dos fases:

1. **Fase 1: Powers of Tau Universal (`pot12_final.ptau`):**  
   Una ceremonia comunitaria multipartita (MPC) que genera potencias de la trampa secreta:
   $$\{ [\tau^i]_1 \}_{i=0}^{2^{12}-1}, \quad \{ [\tau^i]_2 \}_{i=0}^{2^{12}-1}$$
   Un archivo de potencia 12 soporta hasta $2^{12} = 4,096$ restricciones, más que suficiente para nuestras 74 restricciones.
2. **Fase 2: Preparación Específica del Circuito (`range_check_final.zkey`):**  
   Se combinan los polinomios QAP de `range_check.r1cs` con las evaluaciones de potencias de tau para crear la clave del probador $pk$ y exportar la clave de verificación pública [`src/zkp/keys/verification_key.json`](file:///home/gerardo0/repos-github/zkp-sensor-validation-thesis/src/zkp/keys/verification_key.json).

---

## 5. Propiedades Criptográficas Demostradas

* **Completitud Determinista:** Si la lectura física del sensor $val \in [min, max]$, el cálculo de testigos jamás genera una inconsistencia algebraica y el probador siempre emite una prueba aceptada por el verificador.
* **Solidez Incondicional:** Si $val < min$ o $val > max$, el bit más significativo en la descomposición de bits fuerza $b_n = 0$. Al intentar evaluar la restricción de igualdad estricta `ge.out === 1` o `le.out === 1`, el sistema de ecuaciones resulta incompatible:
  $$0 \cdot 1 \neq 1$$
  El motor de cálculo de testigos de SnarkJS aborta de forma determinista con un error de aserción (`Assert Failed in template RangeCheck`), imposibilitando matemáticamente la síntesis de un polinomio cociente $h(x)$ válido.
