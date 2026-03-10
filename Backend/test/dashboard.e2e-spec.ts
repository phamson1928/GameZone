import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Dashboard (e2e)', () => {
    let app: INestApplication<App>;
    let accessToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Login as ADMIN to get token
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'admin@teamzonevn.com',
                password: 'User123456'
            });

        accessToken = loginRes.body.tokens.accessToken;
    });

    afterAll(async () => {
        await app?.close();
    });

    describe('GET /dashboard/stats', () => {
        it('should return 200 and stats for ADMIN', () => {
            return request(app.getHttpServer())
                .get('/dashboard/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('users');
                    expect(res.body).toHaveProperty('zones');
                    expect(res.body).toHaveProperty('social');
                });
        });

        it('should return 401 if no token', () => {
            return request(app.getHttpServer())
                .get('/dashboard/stats')
                .expect(401);
        });
    });

    describe('New Phase 10 Charts', () => {
        it('GET /dashboard/charts/reports should work', () => {
            return request(app.getHttpServer())
                .get('/dashboard/charts/reports')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('label', 'Xu hướng báo cáo (Reports) theo ngày');
                    expect(res.body).toHaveProperty('data');
                });
        });

        it('GET /dashboard/charts/engagement should work', () => {
            return request(app.getHttpServer())
                .get('/dashboard/charts/engagement')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('label', 'Engagement: Zones & Groups mới theo ngày');
                    expect(res.body.data[0]).toHaveProperty('zones');
                    expect(res.body.data[0]).toHaveProperty('groups');
                });
        });

        it('GET /dashboard/charts/top-games should work', () => {
            return request(app.getHttpServer())
                .get('/dashboard/charts/top-games')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('label', 'Top 10 Games phổ biến nhất');
                    expect(Array.isArray(res.body.data)).toBeTruthy();
                });
        });

        it('GET /dashboard/charts/moderation should work', () => {
            return request(app.getHttpServer())
                .get('/dashboard/charts/moderation')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusDistribution');
                    expect(res.body).toHaveProperty('severityDistribution');
                });
        });
    });
});
