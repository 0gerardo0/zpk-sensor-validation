#!/usr/bin/env node
/**
 * Módulo Verificador Criptográfico (Verifier Backend / Cloud)
 * Proyecto: Tesis Validación de Sensores IoT con ZKP (Groth16)
 *
 * Uso CLI:
 *   node verify_proof.js <proof.json> <public.json> [verification_key.json]
 *
 * Exportación programática:
 *   const { verifyProof } = require("./verify_proof");
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const DEFAULT_VK = path.join(__dirname, "../keys/verification_key.json");

async function verifyProof({ proof, publicSignals, vkPath = DEFAULT_VK }) {
  let vk;
  if (typeof vkPath === "string") {
    if (!fs.existsSync(vkPath)) {
      throw new Error(`Llave de verificación (VK) no encontrada en: ${vkPath}`);
    }
    vk = JSON.parse(fs.readFileSync(vkPath, "utf-8"));
  } else {
    vk = vkPath;
  }

  const startTime = process.hrtime.bigint();
  const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return { isValid, latencyMs };
}

// Ejecución directa por CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Uso: node verify_proof.js <proof.json> <public.json> [verification_key.json]");
    process.exit(1);
  }

  const proofPath = path.resolve(args[0]);
  const publicPath = path.resolve(args[1]);
  const vkPath = args[2] ? path.resolve(args[2]) : DEFAULT_VK;

  (async () => {
    try {
      const proof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
      const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf-8"));

      console.log(`[VERIFIER] Verificando emparejamiento bilineal en BN128...`);
      const { isValid, latencyMs } = await verifyProof({ proof, publicSignals, vkPath });

      if (isValid) {
        console.log(`✓ VERIFICACIÓN EXITOSA (Válida) [Tiempo: ${latencyMs.toFixed(2)} ms]`);
        console.log(`  Señales públicas atestadas: min=${publicSignals[0]}, max=${publicSignals[1]}`);
        process.exit(0);
      } else {
        console.error(`✗ VERIFICACIÓN RECHAZADA (Inválida o manipulada) [Tiempo: ${latencyMs.toFixed(2)} ms]`);
        process.exit(2);
      }
    } catch (err) {
      console.error(`✗ Error durante la verificación: ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = { verifyProof };
