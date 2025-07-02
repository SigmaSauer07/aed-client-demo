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
  const enabled = document.getElementById("enhSubdomain").checked;
  document.getElementById("feePreview").innerText = "$" + (enabled ? "2.00" : "0.00");
}

async function registerDomain() {
  if (!AED) return alert("❌ Connect your wallet first.");

  const name = document.getElementById("domainName").value.trim();
  const tld = document.getElementById("tld").value;
  const enh = document.getElementById("enhSubdomain").checked;

  if (!name || !tld) return alert("❌ Name or TLD missing");

  const mintFee = enh ? ethers.utils.parseEther("2") : ethers.BigNumber.from(0);
  const duration = ethers.BigNumber.from("3153600000");

  console.log("ARGS →", {
    name, tld,
    mintFee: mintFee.toString(),
    feeEnabled: enh,
    duration: duration.toString(),
  });

  try {
    const tx = await AED.registerDomain(name, tld, mintFee, enh, duration, {
      value: mintFee
    });
    const receipt = await tx.wait();
    alert("✅ Domain registered! Tx: " + receipt.transactionHash);
  } catch (e) {
    console.error("❌ Revert:", e);
    alert("Tx failed: " + (e.reason || e.message));
  }
}
