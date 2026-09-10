#!/usr/bin/env node
/**
 * Utilidad de Formato y Exportación de Calldata
 * Proyecto: Tesis Validación de Sensores IoT con ZKP (Groth16)
 *
 * Convierte una prueba generada por SnarkJS a calldata compatible con contratos Solidity / Web3
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function exportCalldata(proofPath, publicPath) {
  const proof = JSON.parse(fs.readFileSync(path.resolve(proofPath), "utf-8"));
  const publicSignals = JSON.parse(fs.readFileSync(path.resolve(publicPath), "utf-8"));

  const rawCalldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  return rawCalldata;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Uso: node export_calldata.js <proof.json> <public.json>");
    process.exit(1);
  }

  (async () => {
    try {
      const calldata = await exportCalldata(args[0], args[1]);
      console.log(calldata);
    } catch (err) {
      console.error(`Error exportando calldata: ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = { exportCalldata };
