import {
  WhatsAppTextMessage,
  WhatsAppMediaMessage,
  WhatsAppSendResult,
} from '@/types/whatsapp';

/**
 * Abstract WhatsApp service interface.
 * Implementations can be swapped without changing campaign/customer modules.
 */
export abstract class WhatsAppService {
  abstract sendText(params: WhatsAppTextMessage): Promise<WhatsAppSendResult>;
  abstract sendImage(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult>;
  abstract sendVideo(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult>;
  abstract sendDocument(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult>;
  abstract getMessageStatus(messageId: string): Promise<string | null>;

  /**
   * Format phone number to WhatsApp format (91XXXXXXXXXX for India)
   */
  protected formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }
}
