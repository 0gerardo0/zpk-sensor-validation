# Marco Teórico: Fundamentos Matemáticos de zk-SNARKs y Groth16

**Autor:** Gerardo  
**Proyecto:** Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero  
**Área:** Criptografía Aplicada y Seguridad en Sistemas Distribuidos / IoT  

---

## 1. Definición Formal de un Sistema de Prueba de Conocimiento Cero

Un sistema de pruebas de conocimiento cero para un lenguaje $\mathcal{L} \in \mathcal{NP}$ asociado a una relación binaria polinomial $\mathcal{R}$ está constituido por un triplete de algoritmos probabilísticos en tiempo polinomial $(\text{Setup}, \text{Prove}, \text{Verify})$:

$$\mathcal{R} = \{ (x, w) \mid \mathcal{C}(x, w) = 1 \}$$

Donde:
* $x \in \mathbb{F}^n$ representa la **instancia pública** (en nuestro contexto: los umbrales de operación de los sensores $min$ y $max$).
* $w \in \mathbb{F}^m$ representa el **testigo privado** (*witness*, la medición física bruta $val$ tomada por el sensor).
* $\mathcal{C}$ es el circuito aritmético que codifica la relación de pertenencia.

Para que el esquema sea formalmente seguro bajo el modelo estándar, debe satisfacer tres propiedades axiomáticas:

1. **Completitud Perfecta (*Completeness*):** Si $(x, w) \in \mathcal{R}$, un probador honesto que conoce $w$ convencerá siempre al verificador honesto:
   $$\Pr\left[ \text{Verify}(vk, x, \pi) = 1 \;\middle|\; \begin{array}{l} (pk, vk) \leftarrow \text{Setup}(1^\lambda, \mathcal{C}), \\ \pi \leftarrow \text{Prove}(pk, x, w) \end{array} \right] = 1$$

2. **Solidez Computacional (*Computational Soundness*):** Ningún probador malicioso $\mathcal{P}^*$ en tiempo polinomial puede convencer al verificador de una afirmación falsa, salvo con probabilidad despreciable $\text{negl}(\lambda)$:
   $$\Pr\left[ \text{Verify}(vk, x, \pi^*) = 1 \land \forall w : (x, w) \notin \mathcal{R} \right] \le \text{negl}(\lambda)$$
   En Groth16, esta propiedad se basa en la dureza del problema de conocimiento de exponente (*Knowledge of Exponent Assumption*, KEA) y la no maleabilidad en grupos bilineales.

3. **Conocimiento Cero en Sentido Estricto (*Zero-Knowledge*):** La prueba $\pi$ no revela absolutamente ninguna información sobre $w$, más allá de la veracidad de la proposición. Formalmente, existe un simulador eficiente $\mathcal{S}$ que, sin conocer $w$, genera una transcripción computacionalmente indistinguible de una prueba real:
   $$\text{View}_{\mathcal{V}}(\mathcal{P}(pk, x, w), \mathcal{V}(vk, x)) \approx_c \mathcal{S}(vk, x)$$

---

## 2. Aritmética sobre Curvas Elípticas Pairing-Friendly (BN128)

La implementación en Circom y SnarkJS opera sobre la curva elíptica de Barreto-Naehrig **BN128** (también referenciada como alt_bn128 o BN254), parametrizada para ofrecer un nivel de seguridad equivalente a 128 bits frente a ataques convencionales.

### 2.1 Ecuación de la Curva y Campos Finitos
La curva está definida por la forma corta de Weierstrass:

$$E(\mathbb{F}_q): y^2 = x^3 + 3$$

Donde el orden del campo base primo $q$ y el orden del subgrupo de torsión primo $r$ son:

$$q = 21888242871839275222246405745257275088696311157297823662689037894645226208583$$
$$r = 21888242871839275222246405745257275088548364400416034343698204186575808495617$$

Las variables del circuito Circom no son enteros arbitrarios de máquina (`int32` o `int64`), sino elementos pertenecientes al campo escalar $\mathbb{F}_r$. Toda operación aditiva y multiplicativa se reduce estrictamente módulo $r$.

### 2.2 Grupos Cíclicos y Emparejamientos Bilineales
Se definen tres grupos cíclicos de orden primo $r$:
* $\mathbb{G}_1 = E(\mathbb{F}_q)[r]$: Grupo de puntos racionales sobre el campo base. Sus elementos se representan en coordenadas comprimidas de 32 bytes o proyectivas $(X, Y, Z)$.
* $\mathbb{G}_2 = E'(\mathbb{F}_{q^2})[r]$: Subgrupo sobre la extensión cuadrática $\mathbb{F}_{q^2}$, derivado mediante un twist séxtico $E'$. Sus elementos requieren 64 bytes para coordenadas afines.
* $\mathbb{G}_T = \mu_r \subset \mathbb{F}_{q^{12}}^*$: Grupo multiplicativo de las raíces $r$-ésimas de la unidad en la extensión de grado 12.

Existe una aplicación bilineal eficiente no degenerada (el emparejamiento óptimo de Tate/Ate):

$$e: \mathbb{G}_1 \times \mathbb{G}_2 \to \mathbb{G}_T$$

Que cumple con la propiedad de bilinealidad:

$$\forall P \in \mathbb{G}_1, \; Q \in \mathbb{G}_2, \; a, b \in \mathbb{F}_r : \quad e(aP, bQ) = e(P, Q)^{ab}$$

Esta propiedad permite al verificador comprobar productos en el exponente sin conocer los escalares secretos, siendo el núcleo de la compresión del protocolo Groth16.

---

## 3. Reducción Algebraica: Circuitos Aritméticos, R1CS y QAP

Para probar una relación lógica o aritmética mediante criptografía, el cálculo computacional debe someterse a una secuencia estricta de reducciones algebraicas:

$$\text{Código Fuente (Circom)} \xrightarrow{\text{Aplanamiento}} \text{R1CS} \xrightarrow{\text{Interpolación}} \text{QAP} \xrightarrow{\text{Setup / Prover}} \text{Prueba Groth16}$$

### 3.1 Sistema de Restricciones de Rango 1 (R1CS)
Un R1CS es un conjunto de $m$ ecuaciones matriciales sobre un vector testigo extendido:

$$s = [1, x_1, \dots, x_l, w_1, \dots, w_k]^T \in \mathbb{F}_r^{1 + l + k}$$

Donde $l$ es el número de entradas públicas y $k$ el de entradas privadas/intermedias. Cada restricción individual $i \in \{1, \dots, m\}$ tiene la forma:

$$\langle a_i, s \rangle \cdot \langle b_i, s \rangle = \langle c_i, s \rangle$$

Donde $a_i, b_i, c_i \in \mathbb{F}_r^{|s|}$ son vectores de coeficientes dispersos. El cálculo completo se satisface si y solo si:

$$(A \cdot s) \circ (B \cdot s) = (C \cdot s)$$

Donde $\circ$ denota el producto elemento a elemento (Hadamard).

### 3.2 Programa Aritmético Cuadrático (QAP)
Para compactar las $m$ ecuaciones individuales en una sola identidad de polinomios, se seleccionan $m$ puntos distintos en el campo $\tau_1, \tau_2, \dots, \tau_m \in \mathbb{F}_r$ y se construyen los polinomios interpoladores de Lagrange:

$$u_j(\tau_i) = a_{i,j}, \quad v_j(\tau_i) = b_{i,j}, \quad w_j(\tau_i) = c_{i,j}$$

Se define el polinomio de anulación de los puntos de evaluación:

$$t(x) = \prod_{i=1}^m (x - \tau_i)$$

La satisfacción del sistema R1CS equivale exactamente a la divisibilidad exacta:

$$P(x) = \sum_{j=0}^{|s|} s_j u_j(x) \cdot \sum_{j=0}^{|s|} s_j v_j(x) - \sum_{j=0}^{|s|} s_j w_j(x) \equiv 0 \pmod{t(x)}$$

Es decir, existe un polinomio cociente $h(x)$ tal que:

$$\left(\sum_{j=0}^{|s|} s_j u_j(x)\right) \cdot \left(\sum_{j=0}^{|s|} s_j v_j(x)\right) - \left(\sum_{j=0}^{|s|} s_j w_j(x)\right) = h(x) \cdot t(x)$$

---

## 4. El Protocolo Groth16

El protocolo desarrollado por Jens Groth (2016) optimiza el tamaño de la prueba y el tiempo de verificación al límite teórico inferior: la prueba consta únicamente de 3 elementos de grupo.

### 4.1 Trusted Setup (Ceremonia de Parámetros)
El setup genera una clave de prueba $pk$ y una clave de verificación $vk$ muestreando variables secretas aleatorias (residuo tóxico / *toxic waste*):

$$\tau, \alpha, \beta, \gamma, \delta \xleftarrow{\$} \mathbb{F}_r^*$$

Las llaves contienen evaluaciones de potencias de $\tau$ encriptadas en la curva elíptica:
* **Prover Key ($pk$):** Elementos en $\mathbb{G}_1$ y $\mathbb{G}_2$ que permiten computar combinaciones lineales de los polinomios $u_j(\tau), v_j(\tau), w_j(\tau)$ y $\frac{t(\tau)}{\delta}$.
* **Verifier Key ($vk$):**
  $$vk = \left( [\alpha]_1, [\beta]_2, [\gamma]_2, [\delta]_2, \left\{ \left[ \frac{\beta u_i(\tau) + \alpha v_i(\tau) + w_i(\tau)}{\gamma} \right]_1 \right\}_{i=0}^l \right)$$

### 4.2 Generación de la Prueba ($\pi$)
El probador muestrea dos escalares aleatorios $r_A, r_B \xleftarrow{\$} \mathbb{F}_r$ (para garantizar el conocimiento cero) y computa:

$$A = \alpha + \sum_{i=0}^{|s|} s_i u_i(\tau) + r_A \delta \quad \in \mathbb{G}_1$$

$$B = \beta + \sum_{i=0}^{|s|} s_i v_i(\tau) + r_B \delta \quad \in \mathbb{G}_2$$

$$C = \frac{\sum_{i=l+1}^{|s|} s_i (\beta u_i(\tau) + \alpha v_i(\tau) + w_i(\tau)) + h(\tau)t(\tau) + r_A B + r_B A - r_A r_B \delta}{\delta} \quad \in \mathbb{G}_1$$

La prueba final es el triplete:

$$\pi = (A, B, C) \in \mathbb{G}_1 \times \mathbb{G}_2 \times \mathbb{G}_1$$

Su tamaño en memoria es constante e independiente de la complejidad del circuito:
$$32\text{ bytes} (A) + 64\text{ bytes} (B) + 32\text{ bytes} (C) = 128\text{ bytes}$$

### 4.3 Ecuación de Verificación
El verificador calcula el compromiso de las entradas públicas:

$$X = \left[ \frac{\beta u_0(\tau) + \alpha v_0(\tau) + w_0(\tau)}{\gamma} \right]_1 + \sum_{i=1}^l x_i \cdot \left[ \frac{\beta u_i(\tau) + \alpha v_i(\tau) + w_i(\tau)}{\gamma} \right]_1 \quad \in \mathbb{G}_1$$

Y evalúa la igualdad bilineal en el grupo objetivo $\mathbb{G}_T$:

$$e(A, B) = e([\alpha]_1, [\beta]_2) \cdot e(X, [\gamma]_2) \cdot e(C, [\delta]_2)$$

Si la ecuación se cumple, el verificador acepta que el probador posee un testigo válido $w$ que satisface $\mathcal{C}(x, w) = 1$ con una probabilidad de error inferior a $2^{-128}$.

---

## 5. Análisis Comparativo de Paradigmas ZKP para IoT

| Criterio | Groth16 (Adoptado) | PLONK | Halo2 | STARKs |
| :--- | :--- | :--- | :--- | :--- |
| **Tamaño de la Prueba** | **128 bytes** (Constante) | ~400–800 bytes | ~1–2 KB | ~40–100 KB |
| **Tiempo de Verificación** | **~5–10 ms** (3 pairings) | ~10–20 ms | ~15–30 ms | ~10–50 ms (hashing) |
| **Trusted Setup** | Específico por circuito | Universal / Updatable | No requiere (SRS transparente) | Transparente (Hash) |
| **Supuestos Criptográficos** | Emparejamientos bilineales (KEA) | Emparejamientos (KZG) | IPA / Curvas elípticas | Solo funciones hash seguras |
| **Sobrecarga en el Edge/Cloud** | Mínima latencia de red y gas | Moderada | Moderada | Elevada latencia por tamaño de prueba |

**Conclusión del Diseño:**  
Aunque PLONK y Halo2 ofrecen ceremonias de configuración universal o transparente, **Groth16 es la elección matemáticamente óptima para sistemas distribuidos de telemetría IoT**. Su huella de transmisión (128 bytes) permite transferir la atestación por canales de bajo ancho de banda (MQTT, LoRaWAN, CoAP) con un costo de cómputo para el verificador en el orden de sub-10 milisegundos.
