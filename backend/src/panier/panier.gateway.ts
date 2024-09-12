import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class PanierGateway implements OnGatewayInit {
  private readonly logger = new Logger(PanierGateway.name);

  @WebSocketServer() server: Server | undefined;

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  emitPanierUpdate(panierId: any) {
    // @ts-ignore
    this.server.emit('panierUpdate', panierId);
  }
}
