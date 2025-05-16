import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export function useBiometricAuth() {
  async function registerBiometric(username: string) {
    const optionsRes = await fetch("/api/webauthn/register-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      credentials: "include",
    });
    const options = await optionsRes.json();
    const attResp = await startRegistration(options);
    await fetch("/api/webauthn/register-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attResp),
      credentials: "include",
    });
  }

  async function loginWithBiometric(username: string) {
    const optionsRes = await fetch("/api/webauthn/login-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      credentials: "include",
    });
    const options = await optionsRes.json();

    // Checagem e log
    if (!options || typeof options !== "object") {
      throw new Error("Opções de autenticação inválidas recebidas do backend.");
    }
    if (!("allowCredentials" in options)) {
      options.allowCredentials = [];
    }

    console.log("WebAuthn login options:", options);

    const assertion = await startAuthentication(options);
    await fetch("/api/webauthn/login-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assertion),
      credentials: "include",
    });
  }

  return { registerBiometric, loginWithBiometric };
}
