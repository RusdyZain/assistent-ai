import { WahaProvider } from "@/lib/whatsapp/providers/waha";
import { WhatsAppProvider } from "@/lib/whatsapp/types";

let provider: WhatsAppProvider | null = null;

function resolveProviderName() {
  const configuredProvider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() ?? "waha";
  return configuredProvider;
}

export function getWhatsAppProvider() {
  if (provider) return provider;

  const configuredProvider = resolveProviderName();
  if (configuredProvider !== "waha") {
    console.warn(
      `[WhatsApp] Provider "${configuredProvider}" tidak didukung. Fallback ke WAHA.`,
    );
  }

  provider = new WahaProvider();
  return provider;
}

export function getConfiguredWhatsAppProviderName() {
  return resolveProviderName();
}

export function resetWhatsAppProviderForTests() {
  provider = null;
}
