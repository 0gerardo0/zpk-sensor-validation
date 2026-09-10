const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const assert = require("assert");

async function run() {
  console.log("=== INICIANDO BATERÍA DE PRUEBAS AUTOMATIZADAS (ZKP RANGE CHECK) ===");
  const vkPath = path.join(__dirname, "../src/zkp/keys/verification_key.json");
  const zkeyPath = path.join(__dirname, "../src/zkp/keys/range_check_final.zkey");
  const wasmPath = path.join(__dirname, "../src/zkp/circuits/range_check_js/range_check.wasm");

  assert(fs.existsSync(vkPath), "verification_key.json debe existir");
  assert(fs.existsSync(zkeyPath), "range_check_final.zkey debe existir");
  assert(fs.existsSync(wasmPath), "range_check.wasm debe existir");
  const vk = JSON.parse(fs.readFileSync(vkPath));

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ [FAIL] ${name}: ${e.message}`);
    }
  }

  await test("1. Completitud: Valor nominal (val=24, min=18, max=30)", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { val: 24, min: 18, max: 30 },
      wasmPath,
      zkeyPath
    );
    assert.deepStrictEqual(publicSignals, ["18", "30"]);
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
    assert.strictEqual(isValid, true);
  });

  await test("2. Frontera Inferior: val == min (val=18, min=18, max=30)", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { val: 18, min: 18, max: 30 },
      wasmPath,
      zkeyPath
    );
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
    assert.strictEqual(isValid, true);
  });

  await test("3. Frontera Superior: val == max (val=30, min=18, max=30)", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { val: 30, min: 18, max: 30 },
      wasmPath,
      zkeyPath
    );
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
    assert.strictEqual(isValid, true);
  });

  await test("4. Límite Cero: val=0 en [0, 100]", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { val: 0, min: 0, max: 100 },
      wasmPath,
      zkeyPath
    );
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, proof);
    assert.strictEqual(isValid, true);
  });

  await test("5. Solidez: Rechazo de valor inferior (val=17, min=18, max=30)", async () => {
    let failed = false;
    try {
      await snarkjs.groth16.fullProve({ val: 17, min: 18, max: 30 }, wasmPath, zkeyPath);
    } catch (e) {
      failed = true;
    }
    assert.strictEqual(failed, true, "El cálculo del testigo debió fallar por aserción");
  });

  await test("6. Solidez: Rechazo de valor superior (val=31, min=18, max=30)", async () => {
    let failed = false;
    try {
      await snarkjs.groth16.fullProve({ val: 31, min: 18, max: 30 }, wasmPath, zkeyPath);
    } catch (e) {
      failed = true;
    }
    assert.strictEqual(failed, true, "El cálculo del testigo debió fallar por aserción");
  });

  await test("7. Integridad de Señales Públicas (Anti-Tampering)", async () => {
    const { proof } = await snarkjs.groth16.fullProve(
      { val: 24, min: 18, max: 30 },
      wasmPath,
      zkeyPath
    );
    const tamperedSignals = ["26", "30"];
    const isValid = await snarkjs.groth16.verify(vk, tamperedSignals, proof);
    assert.strictEqual(isValid, false);
  });

  await test("8. Integridad Criptográfica de la Prueba (Anti-Tampering pi_a)", async () => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { val: 24, min: 18, max: 30 },
      wasmPath,
      zkeyPath
    );
    const tamperedProof = JSON.parse(JSON.stringify(proof));
    tamperedProof.pi_a[0] = "999999999999999999999999";
    const isValid = await snarkjs.groth16.verify(vk, publicSignals, tamperedProof);
    assert.strictEqual(isValid, false);
  });

  console.log(`\nRESUMEN: ${passed}/${total} pruebas pasaron exitosamente.`);
  if (passed !== total) process.exit(1);
}

run();
