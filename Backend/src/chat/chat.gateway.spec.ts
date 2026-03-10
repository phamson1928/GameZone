import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway.js';
import { MessagesService } from '../messages/messages.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws-jwt.guard.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let messagesService: MessagesService;
    let prisma: PrismaService;

    const mockMessagesService = {
        createMessage: jest.fn(),
    };

    const mockPrismaService = {
        groupMember: {
            findUnique: jest.fn(),
        },
    };

    const mockSocket = {
        id: 'socket-id',
        data: {
            user: { sub: 'user-1', username: 'testuser' },
        },
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        handshake: { auth: { token: 'Bearer token' } },
    } as unknown as Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: MessagesService, useValue: mockMessagesService },
                { provide: PrismaService, useValue: mockPrismaService },
                // Mock dependencies for WsJwtGuard
                { provide: JwtService, useValue: {} },
                { provide: ConfigService, useValue: { get: jest.fn() } },
                WsJwtGuard,
            ],
        })
            .overrideGuard(WsJwtGuard)
            .useValue({ canActivate: () => true })
            .compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        messagesService = module.get<MessagesService>(MessagesService);
        prisma = module.get<PrismaService>(PrismaService);

        // Mock server
        gateway.server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleJoinRoom', () => {
        it('should join the room if user is a member', async () => {
            const data = { groupId: 'group-1' };
            (mockPrismaService.groupMember.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' });

            const result = await gateway.handleJoinRoom(data, mockSocket);

            expect(result.success).toBe(true);
            expect(mockSocket.join).toHaveBeenCalledWith('group:group-1');
            expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
        });

        it('should throw WsException if user is not a member', async () => {
            const data = { groupId: 'group-1' };
            (mockPrismaService.groupMember.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(gateway.handleJoinRoom(data, mockSocket)).rejects.toThrow(WsException);
        });
    });

    describe('handleSendMessage', () => {
        it('should create a message and broadcast it', async () => {
            const data = { groupId: 'group-1', content: 'Hello' };
            const mockSavedMsg = { id: 'm-1', content: 'Hello', createdAt: new Date(), sender: { username: 'testuser' } };
            (mockMessagesService.createMessage as jest.Mock).mockResolvedValue(mockSavedMsg);

            await gateway.handleSendMessage(data, mockSocket);

            expect(messagesService.createMessage).toHaveBeenCalledWith('user-1', 'group-1', 'Hello');
            expect(gateway.server.to).toHaveBeenCalledWith('group:group-1');
            expect(gateway.server.emit).toHaveBeenCalledWith('newMessage', expect.objectContaining({ content: 'Hello' }));
        });

        it('should throw if content is empty', async () => {
            const data = { groupId: 'group-1', content: '' };
            await expect(gateway.handleSendMessage(data, mockSocket)).rejects.toThrow(WsException);
        });
    });
});
