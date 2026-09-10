import { Response } from 'express';

export interface RealtimeMessage {
  type: string;
  data: any;
  timestamp: string;
}

class RealtimeBus {
  private clients: Set<Response> = new Set();

  public registerClient(res: Response) {
    this.clients.add(res);

    // Initial keep-alive ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { status: 'ok' }, timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public broadcast(type: string, data: any) {
    const payload: RealtimeMessage = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtimeBus = new RealtimeBus();
