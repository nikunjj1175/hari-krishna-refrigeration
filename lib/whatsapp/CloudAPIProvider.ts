import { WhatsAppService } from './WhatsAppService';
import {
  WhatsAppTextMessage,
  WhatsAppMediaMessage,
  WhatsAppSendResult,
} from '@/types/whatsapp';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * WhatsApp Cloud API implementation (Meta's official API).
 */
export class CloudAPIProvider extends WhatsAppService {
  private token: string;
  private phoneNumberId: string;

  constructor() {
    super();
    this.token = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private get apiUrl() {
    return `${BASE_URL}/${this.phoneNumberId}/messages`;
  }

  async sendText(params: WhatsAppTextMessage): Promise<WhatsAppSendResult> {
    try {
      const to = this.formatPhone(params.to);
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: params.message, preview_url: false },
      };

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data?.error?.message || 'Failed to send message',
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendImage(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult> {
    try {
      const to = this.formatPhone(params.to);
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          link: params.mediaUrl,
          caption: params.caption || params.message || '',
        },
      };

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error?.message || 'Failed to send image' };
      }

      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendVideo(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult> {
    try {
      const to = this.formatPhone(params.to);
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'video',
        video: {
          link: params.mediaUrl,
          caption: params.caption || params.message || '',
        },
      };

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error?.message || 'Failed to send video' };
      }

      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async sendDocument(params: WhatsAppMediaMessage): Promise<WhatsAppSendResult> {
    try {
      const to = this.formatPhone(params.to);
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          link: params.mediaUrl,
          caption: params.caption || params.message || '',
          filename: params.fileName || 'document',
        },
      };

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error?.message || 'Failed to send document' };
      }

      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getMessageStatus(messageId: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE_URL}/${messageId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data?.status || null;
    } catch {
      return null;
    }
  }
}
