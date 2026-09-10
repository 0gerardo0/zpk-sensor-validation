# Bibliografía Académica y Estado del Arte

**Proyecto de Tesis:** Sistema de Validación de Datos de Sensores IoT usando Pruebas de Conocimiento Cero  
**Repositorio:** [0gerardo0/zkp-sensor-validation-thesis](https://github.com/0gerardo0/zpk-sensor-validation)  

---

## 1. Criptografía Zero-Knowledge y Sistemas de Pruebas

* **[Groth16]** J. Groth, "On the Size of Pairing-Based Non-interactive Arguments," in *Advances in Cryptology – EUROCRYPT 2016*, Lecture Notes in Computer Science, vol. 9666, pp. 305–326, Springer, Berlin, Heidelberg, 2016.  
  DOI: [10.1007/978-3-662-49896-5_11](https://doi.org/10.1007/978-3-662-49896-5_11)  
  *Relevancia en la tesis:* Define la construcción matemática del sistema zk-SNARK con tamaño de prueba constante (3 elementos de grupo) y tiempo de verificación mínimo empleado en este proyecto.

* **[Bowe17]** S. Bowe, A. Gabizon, and I. Miers, "Scalable Multi-party Computation for zk-SNARK Parameters in the Random Beacon Model," *Cryptology ePrint Archive*, Report 2017/1050, 2017.  
  Enlace: [https://eprint.iacr.org/2017/1050](https://eprint.iacr.org/2017/1050)  
  *Relevancia en la tesis:* Base teórica de la ceremonia de *Powers of Tau* utilizada para generar el archivo de parámetros universales `pot12_final.ptau`.

* **[BN05]** P. S. L. M. Barreto and M. Naehrig, "Pairing-Friendly Elliptic Curves of Prime Order," in *Selected Areas in Cryptography – SAC 2005*, Lecture Notes in Computer Science, vol. 3897, pp. 319–331, Springer, Berlin, Heidelberg, 2005.  
  DOI: [10.1007/11693383_22](https://doi.org/10.1007/11693383_22)  
  *Relevancia en la tesis:* Especificación de la curva elíptica de emparejamiento BN128 (alt_bn128) empleada por el compilador Circom y SnarkJS.

* **[GGPR13]** R. Gennaro, C. Gentry, B. Parno, and M. Raykova, "Quadratic Span Programs and Succinct NIZKs without PCPs," in *Advances in Cryptology – EUROCRYPT 2013*, pp. 626–645, Springer, 2013.  
  *Relevancia en la tesis:* Introducción formal de los Programas Aritméticos Cuadráticos (QAP) y la reducción desde circuitos booleanos/aritméticos.

* **[Buterin16]** V. Buterin, "Quadratic Arithmetic Programs: from Zero to Hero," *Ethereum Foundation Research*, 2016.  
  Enlace: [https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649)  
  *Relevancia en la tesis:* Explicación didáctica de la transformación de restricciones matriciales R1CS a identidades polinomiales divisibles por el polinomio objetivo.

* **[Circom2]** J. Baylina, M. Bellés, and Iden3 Team, "Circom 2.0: A Circuit Compiler for Zero-Knowledge Proofs," *Iden3 Documentation and Specifications*, 2021.  
  Enlace: [https://docs.circom.io/](https://docs.circom.io/)  
  *Relevancia en la tesis:* Sintaxis de especificación, plantillas de orden superior y biblioteca de componentes aritméticos (`circomlib`) utilizada en `range_check.circom`.

* **[RareSkills23]** RareSkills, "The RareSkills Zero Knowledge Book: A Practical Mathematical Guide," *RareSkills Research*, 2023.  
  Enlace: [https://www.rareskills.io/zk-book](https://www.rareskills.io/zk-book)  
  *Relevancia en la tesis:* Análisis de microoptimizaciones de restricciones R1CS y buenas prácticas en descomposición de bits.

---

## 2. Seguridad en Internet de las Cosas (IoT) y Criptografía Ligera

* **[Koc18]** M. A. Koc, C. Eyupoglu, and M. A. Aydin, "Security and Privacy Challenges in IoT-based Healthcare Systems," *IEEE Access*, vol. 6, pp. 62890–62901, 2018.  
  *Relevancia en la tesis:* Fundamenta la necesidad de preservar la privacidad de datos de sensores médicos o biométricos frente a intermediarios no confiables.

* **[NIST8259]** National Institute of Standards and Technology (NIST), "Foundational Cybersecurity Activities for IoT Device Manufacturers," *NIST Internal Report 8259*, 2020.  
  DOI: [10.6028/NIST.IR.8259](https://doi.org/10.6028/NIST.IR.8259)  
  *Relevancia en la tesis:* Guía de mitigación de vectores de ataque en nodos de sensado de borde.

* **[Menezes96]** A. J. Menezes, P. C. van Oorschot, and S. A. Vanstone, *Handbook of Applied Cryptography*, CRC Press, Boca Raton, FL, 1996.  
  *Relevancia en la tesis:* Análisis formal de mecanismos de autenticación de mensajes (HMAC) y no-repudio en arquitecturas cliente-servidor distribuidas.
