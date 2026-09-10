#!/usr/bin/env node
/**
 * Módulo Generador de Pruebas ZKP (Prover Edge)
 * Proyecto: Tesis Validación de Sensores IoT con ZKP (Groth16)
 *
 * Uso CLI:
 *   node generate_proof.js <val> <min> <max> [output_dir]
 *
 * Exportación programática:
 *   const { generateProof } = require("./generate_proof");
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const DEFAULT_WASM = path.join(__dirname, "../circuits/range_check_js/range_check.wasm");
const DEFAULT_ZKEY = path.join(__dirname, "../keys/range_check_final.zkey");

async function generateProof({ val, min, max, wasmPath = DEFAULT_WASM, zkeyPath = DEFAULT_ZKEY }) {
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`Circuito compilado no encontrado en: ${wasmPath}`);
  }
  if (!fs.existsSync(zkeyPath)) {
    throw new Error(`Llave de probador (zkey) no encontrada en: ${zkeyPath}`);
  }

  const inputSignals = {
    val: Number(val),
    min: Number(min),
    max: Number(max)
  };

  const startTime = process.hrtime.bigint();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputSignals,
    wasmPath,
    zkeyPath
  );
  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return { proof, publicSignals, latencyMs };
}

// Ejecución directa por CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Uso: node generate_proof.js <val> <min> <max> [output_dir]");
    console.log("Ejemplo: node generate_proof.js 24 18 30 .");
    process.exit(1);
  }

  const val = Number(args[0]);
  const min = Number(args[1]);
  const max = Number(args[2]);
  const outDir = args[3] || process.cwd();

  (async () => {
    try {
      console.log(`[PROVER] Generando prueba Groth16 para val=${val} en rango [${min}, ${max}]...`);
      const { proof, publicSignals, latencyMs } = await generateProof({ val, min, max });

      const proofFile = path.join(outDir, "proof.json");
      const publicFile = path.join(outDir, "public.json");

      fs.writeFileSync(proofFile, JSON.stringify(proof, null, 2));
      fs.writeFileSync(publicFile, JSON.stringify(publicSignals, null, 2));

      console.log(`✓ Prueba generada exitosamente en ${latencyMs.toFixed(2)} ms`);
      console.log(`  - Prueba guardada en: ${proofFile}`);
      console.log(`  - Señales públicas guardadas en: ${publicFile}`);
    } catch (err) {
      console.error(`✗ Error generando la prueba: ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = { generateProof };
