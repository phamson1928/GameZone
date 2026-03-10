import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportStatus, ReportTargetType, ReportSeverity } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
    let service: ReportsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        report: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: { findUnique: jest.fn() },
        zone: { findUnique: jest.fn() },
        group: { findUnique: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should throw BadRequestException if reporting self', async () => {
            const dto = { targetType: ReportTargetType.USER, targetId: 'user-1', reason: 'Some reason' };
            await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if target does not exist', async () => {
            const dto = { targetType: ReportTargetType.USER, targetId: 'user-2', reason: 'Some reason' };
            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException);
        });

        it('should create report successfully', async () => {
            const dto = { targetType: ReportTargetType.USER, targetId: 'user-2', reason: 'Toxic behavior', severity: ReportSeverity.MEDIUM };
            (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
            (mockPrismaService.report.create as jest.Mock).mockResolvedValue({ id: 'r-1', ...dto });

            const result = await service.create('user-1', dto);

            expect(result.id).toBe('r-1');
            expect(mockPrismaService.report.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ severity: ReportSeverity.MEDIUM }),
                include: expect.anything()
            });
        });
    });

    describe('resolve', () => {
        it('should mark an OPEN report as RESOLVED', async () => {
            const adminId = 'admin-1';
            const reportId = 'r-1';
            const dto = { resolutionNote: 'Done' };

            (mockPrismaService.report.findUnique as jest.Mock).mockResolvedValue({ id: reportId, status: ReportStatus.OPEN });
            (mockPrismaService.report.update as jest.Mock).mockResolvedValue({ id: reportId, status: ReportStatus.RESOLVED });

            const result = await service.resolve(adminId, reportId, dto);

            expect(result.status).toBe(ReportStatus.RESOLVED);
            expect(mockPrismaService.report.update).toHaveBeenCalledWith({
                where: { id: reportId },
                data: expect.objectContaining({ status: ReportStatus.RESOLVED, resolutionNote: 'Done' }),
                include: expect.anything()
            });
        });
    });
});
