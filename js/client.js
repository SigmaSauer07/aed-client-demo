const CONTRACT_ADDRESS = '0x3Bf795D47f7B32f36cbB1222805b0E0c5EF066f1';
let provider, signer, AED;

async function connectWallet() {
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  const abi = await fetch('js/aedABI.json').then(r => r.json());
  AED = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  document.getElementById("wallet").innerText =
    "Wallet: " + await signer.getAddress();
}

function updateFee() {
  document.getElementById("feePreview").innerText =
    "$" + (document.getElementById("enhSubdomain").checked ? "2.00" : "0.00");
}

async function registerDomain() {
  if (!AED) return alert("❌ Connect your wallet first.");
  const name = document.getElementById("domainName").value.trim();
  const tld = document.getElementById("tld").value;
  const enh = document.getElementById("enhSubdomain").checked;
  if (!name || !tld) return alert("❌ Name or TLD missing");

  const fee = enh
    ? ethers.utils.parseEther("2")
    : ethers.BigNumber.from(0);
  const feeEnabled = enh;
  const duration = ethers.BigNumber.from("3153600000");

  console.log("ARGS →", {
    name, tld,
    mintFee: fee.toString(),
    feeEnabled,
    duration: duration.toString(),
  });

  // callStatic check
  try {
    await AED.callStatic.registerDomain(
      name, tld, fee, feeEnabled, duration,
      { value: fee }
    );
  } catch (e) {
    console.error("↩ callStatic revert:", e);
    return alert("Revert reason: " + (e.reason || e.message));
  }

  // Estimate gas limit
  let gasLimit;
  try {
    const est = await AED.estimateGas.registerDomain(
      name, tld, fee, feeEnabled, duration,
      { value: fee }
    );
    gasLimit = est.mul(120).div(100);
  } catch {
    console.warn("⚠ Using fallback gas limit 500k");
    gasLimit = ethers.BigNumber.from(500000);
  }

  // Execute transaction
  try {
    const tx = await AED.registerDomain(
      name, tld, fee, feeEnabled, duration,
      { value: fee, gasLimit }
    );
    const receipt = await tx.wait();
    alert("✅ Registered! TxHash: " + receipt.transactionHash);
  } catch (e) {
    console.error("❌ Tx failed:", e);
    alert("Tx failed: " + (e.reason || e.error?.message || e.message));
  }
}
