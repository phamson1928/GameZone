import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Friends (e2e)', () => {
    let app: INestApplication<App>;
    let user1Token: string;
    let user1Id: string;
    let user2Id: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Login as SonGoku_VN to get user1 token
        const loginRes1 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'son.pham@example.com',
                password: 'User123456'
            });

        user1Token = loginRes1.body.tokens.accessToken;
        user1Id = loginRes1.body.userId;

        // Login as Linh_Xinh_Genshin to get user2Id
        const loginRes2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'linh.nguyen@example.com',
                password: 'User123456'
            });

        user2Id = loginRes2.body.userId;
    });

    afterAll(async () => {
        await app?.close();
    });

    describe('GET /friends', () => {
        it('should get friend list for User 1', () => {
            return request(app.getHttpServer())
                .get('/friends')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('meta');
                });
        });
    });

    describe('GET /friends/requests', () => {
        it('should get pending incoming requests', () => {
            return request(app.getHttpServer())
                .get('/friends/requests')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);
        });
    });

    describe('Friend Request Flow', () => {
        // Tuan_Fps_God is already a friend of SonGoku_VN in seed,
        // Let's create a new request or check the current friend list.
        // For testing, let's pick a user that is not a friend yet.
        // Duo_Solo_Top has a pending request in seed (from Duy_Solo_Top).

        it('should return error if trying to friend oneself', () => {
            return request(app.getHttpServer())
                .post(`/friends/request/${user1Id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(400);
        });

        // Let's use a fresh registered user to test friend flow.
        it('should send a friend request, then accept it', async () => {
            // Pick a user that is not friend with SonGoku_VN.
            // In seed, SonGoku_VN is friends with Tuan_Fps_God, Linh_Xinh_Genshin, TestUser_Seed.
            // He is NOT friends with Huong_Support or Duy_Solo_Top.
            const targetRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'huong.le@example.com',
                    password: 'User123456'
                });
            const huongId = targetRes.body.userId;
            const huongToken = targetRes.body.tokens.accessToken;

            // Huong removes any existing relation with SonGoku for fresh test
            await request(app.getHttpServer())
                .delete(`/friends/${user1Id}`)
                .set('Authorization', `Bearer ${huongToken}`)
                .expect((res) => {
                    if (res.status !== 200 && res.status !== 404) {
                        throw new Error(`Cleanup failed: ${res.status}`);
                    }
                });

            // User 1 sends to Huong
            const sendRes = await request(app.getHttpServer())
                .post(`/friends/request/${huongId}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(201);

            const friendshipId = sendRes.body.id;

            // Huong accepts it
            await request(app.getHttpServer())
                .patch(`/friends/request/${friendshipId}`)
                .set('Authorization', `Bearer ${huongToken}`)
                .expect(200);

            // Verify friendship exists in Huong list
            await request(app.getHttpServer())
                .get('/friends')
                .set('Authorization', `Bearer ${huongToken}`)
                .expect((res) => {
                    const isFriend = res.body.data.some(f => f.senderId === user1Id || f.receiverId === user1Id);
                    expect(isFriend).toBeTruthy();
                });
        });
    });
});
