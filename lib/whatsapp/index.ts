import { WhatsAppService } from './WhatsAppService';
import { CloudAPIProvider } from './CloudAPIProvider';

let instance: WhatsAppService | null = null;

/**
 * Factory to get the configured WhatsApp provider.
 * Swap provider here without changing any other module.
 */
export function getWhatsAppService(): WhatsAppService {
  if (!instance) {
    // Future: check env var for provider type, e.g. 'twilio', 'wati', etc.
    instance = new CloudAPIProvider();
  }
  return instance;
}

export { WhatsAppService };
