import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardPeriod } from './dto/dashboard-query.dto.js';

describe('DashboardService', () => {
    let service: DashboardService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: { count: jest.fn() },
        zone: { count: jest.fn() },
        group: { count: jest.fn() },
        report: { count: jest.fn(), groupBy: jest.fn() },
        userProfile: { count: jest.fn() },
        friendship: { count: jest.fn() },
        userLike: { count: jest.fn() },
        quickMatchQueue: { count: jest.fn() },
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getStats', () => {
        it('should return aggregated stats correctly', async () => {
            (mockPrismaService.user.count as jest.Mock).mockResolvedValue(100);
            (mockPrismaService.zone.count as jest.Mock).mockResolvedValue(50);
            (mockPrismaService.group.count as jest.Mock).mockResolvedValue(20);
            (mockPrismaService.report.count as jest.Mock).mockResolvedValue(10);
            (mockPrismaService.userProfile.count as jest.Mock).mockResolvedValue(30);
            (mockPrismaService.friendship.count as jest.Mock).mockResolvedValue(40);
            (mockPrismaService.userLike.count as jest.Mock).mockResolvedValue(200);
            (mockPrismaService.quickMatchQueue.count as jest.Mock).mockResolvedValue(5);

            const stats = await service.getStats();

            expect(stats.users.total).toBe(100);
            expect(stats.zones.total).toBe(50);
            expect(stats.social.totalFriendships).toBe(40);
        });
    });

    describe('getModerationChart', () => {
        it('should return grouped moderation stats', async () => {
            (mockPrismaService.report.groupBy as jest.Mock)
                .mockResolvedValueOnce([{ status: 'OPEN', _count: 4 }, { status: 'RESOLVED', _count: 6 }])
                .mockResolvedValueOnce([{ severity: 'HIGH', _count: 2 }, { severity: 'LOW', _count: 8 }]);

            const moderation = await service.getModerationChart();

            expect(moderation.statusDistribution).toHaveLength(2);
            expect(moderation.severityDistribution).toHaveLength(2);
            expect(moderation.statusDistribution[0].status).toBe('OPEN');
        });
    });
});
