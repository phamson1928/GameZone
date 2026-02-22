import { PrismaClient, Platform } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 0. Clean up existing data
  console.log('🧹 Cleaning up existing data...');

  // Delete in correct order to respect foreign keys
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.zoneJoinRequest.deleteMany();
  await prisma.zoneContactMethod.deleteMany();
  await prisma.zoneTagRelation.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.userGameProfile.deleteMany();
  await prisma.game.deleteMany();

  // Optional: delete users if you want a full reset, but upsert handles existing ones fine
  // await prisma.user.deleteMany();

  console.log('✅ Cleaned up existing data');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('Admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamzonevn.com' },
    update: {},
    create: {
      email: 'admin@teamzonevn.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'TeamZoneVN Administrator',
          playStyle: 'Competitive',
          timezone: 'Asia/Ho_Chi_Minh',
        },
      },
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // 2. Create Regular Users
  const user1Password = await bcrypt.hash('User123456', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      username: 'ProGamer2024',
      passwordHash: user1Password,
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Passionate gamer looking for teammates',
          playStyle: 'Aggressive',
          timezone: 'Asia/Ho_Chi_Minh',
        },
      },
    },
  });
  console.log('✅ Created user:', user1.email);

  const user2Password = await bcrypt.hash('User123456', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      username: 'CasualPlayer',
      passwordHash: user2Password,
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          bio: 'Just here to have fun!',
          playStyle: 'Casual',
          timezone: 'Asia/Bangkok',
        },
      },
    },
  });
  console.log('✅ Created user:', user2.email);

  // 3. Create Games
  const valorant = await prisma.game.create({
    data: {
      name: 'Valorant',
      iconUrl: 'https://i.imgur.com/xQJ9K3k.png',
      bannerUrl: 'https://i.imgur.com/yN9tZ2L.jpg',
      isActive: true,
      platforms: [Platform.PC],
    },
  });
  console.log('✅ Created game:', valorant.name);

  const lol = await prisma.game.create({
    data: {
      name: 'League of Legends',
      iconUrl: 'https://i.imgur.com/dJU5A4y.png',
      bannerUrl: 'https://i.imgur.com/kL3mN7P.jpg',
      isActive: true,
      platforms: [Platform.PC],
    },
  });
  console.log('✅ Created game:', lol.name);

  const genshin = await prisma.game.create({
    data: {
      name: 'Genshin Impact',
      iconUrl: 'https://i.imgur.com/vX8yQ2w.png',
      bannerUrl: 'https://i.imgur.com/tR5sP9K.jpg',
      isActive: true,
      platforms: [Platform.PC, Platform.MOBILE, Platform.CONSOLE],
    },
  });
  console.log('✅ Created game:', genshin.name);

  const codm = await prisma.game.create({
    data: {
      name: 'Call of Duty Mobile',
      iconUrl: 'https://i.imgur.com/aB3cD4e.png',
      bannerUrl: 'https://i.imgur.com/fG5hI6j.jpg',
      isActive: true,
      platforms: [Platform.MOBILE],
    },
  });
  console.log('✅ Created game:', codm.name);

  const fifa = await prisma.game.create({
    data: {
      name: 'FIFA 24',
      iconUrl: 'https://i.imgur.com/kL7mN8o.png',
      bannerUrl: 'https://i.imgur.com/pQ9rS1t.jpg',
      isActive: true,
      platforms: [Platform.PC, Platform.CONSOLE],
    },
  });
  console.log('✅ Created game:', fifa.name);

  // 4. Create User Game Profiles
  await prisma.userGameProfile.create({
    data: {
      userId: user1.id,
      gameId: valorant.id,
      rankLevel: 'ADVANCED',
    },
  });

  await prisma.userGameProfile.create({
    data: {
      userId: user1.id,
      gameId: lol.id,
      rankLevel: 'INTERMEDIATE',
    },
  });

  await prisma.userGameProfile.create({
    data: {
      userId: user2.id,
      gameId: genshin.id,
      rankLevel: 'BEGINNER',
    },
  });

  await prisma.userGameProfile.create({
    data: {
      userId: user2.id,
      gameId: codm.id,
      rankLevel: 'INTERMEDIATE',
    },
  });
  console.log('✅ Created user game profiles');

  // 5. Create Zones
  const zone1 = await prisma.zone.create({
    data: {
      gameId: valorant.id,
      ownerId: user1.id,
      title: 'Tìm đồng đội Rank Diamond+',
      description:
        'Cần 2 người chơi rank từ Diamond trở lên. Có mic, chơi nghiêm túc.',
      minRankLevel: 'ADVANCED',
      maxRankLevel: 'PRO',
      requiredPlayers: 2,
      status: 'OPEN',
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Có Mic' },
                create: { name: 'Có Mic' },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Leo Rank' },
                create: { name: 'Leo Rank' },
              },
            },
          },
        ],
      },
      contacts: {
        create: [
          { type: 'DISCORD', value: 'ProGamer#1234' },
          { type: 'INGAME', value: 'ProGamer2024' },
        ],
      },
    },
  });
  console.log('✅ Created zone:', zone1.title);

  const zone2 = await prisma.zone.create({
    data: {
      gameId: lol.id,
      ownerId: user1.id,
      title: 'Leo Rank Vàng - Cần Support',
      description:
        'Đang leo rank Vàng, cần 1 support main. Chơi vui vẻ, không toxic.',
      minRankLevel: 'BEGINNER',
      maxRankLevel: 'INTERMEDIATE',
      requiredPlayers: 1,
      status: 'OPEN',
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Vui Vẻ' },
                create: { name: 'Vui Vẻ' },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Leo Rank' },
                create: { name: 'Leo Rank' },
              },
            },
          },
        ],
      },
      contacts: {
        create: [{ type: 'DISCORD', value: 'ProGamer#1234' }],
      },
    },
  });
  console.log('✅ Created zone:', zone2.title);

  const zone3 = await prisma.zone.create({
    data: {
      gameId: genshin.id,
      ownerId: user2.id,
      title: 'Coop Boss World Level 8',
      description:
        'Tìm người chơi cùng đánh boss world level 8. Newbie friendly!',
      minRankLevel: 'BEGINNER',
      maxRankLevel: 'ADVANCED',
      requiredPlayers: 3,
      status: 'OPEN',
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Người Mới' },
                create: { name: 'Người Mới' },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Chill' },
                create: { name: 'Chill' },
              },
            },
          },
        ],
      },
      contacts: {
        create: [
          { type: 'INGAME', value: 'CasualPlayer' },
          { type: 'OTHER', value: 'Telegram: @casual_player' },
        ],
      },
    },
  });
  console.log('✅ Created zone:', zone3.title);

  const zone4 = await prisma.zone.create({
    data: {
      gameId: codm.id,
      ownerId: user2.id,
      title: 'Battle Royale Squad',
      description:
        'Chơi Battle Royale chill, không cần skill cao. Just for fun!',
      minRankLevel: 'BEGINNER',
      maxRankLevel: 'INTERMEDIATE',
      requiredPlayers: 2,
      status: 'OPEN',
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Vui Vẻ' },
                create: { name: 'Vui Vẻ' },
              },
            },
          },
          {
            tag: {
              connectOrCreate: {
                where: { name: 'Chill' },
                create: { name: 'Chill' },
              },
            },
          },
        ],
      },
      contacts: {
        create: [{ type: 'INGAME', value: 'CasualPlayer123' }],
      },
    },
  });
  console.log('✅ Created zone:', zone4.title);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - 3 Users (1 Admin, 2 Regular)');
  console.log('   - 5 Games (with platforms)');
  console.log('   - 4 User Game Profiles');
  console.log('   - 4 Zones (with tags and contacts)');
  console.log('\n🔐 Login credentials:');
  console.log('   Admin: admin@teamzonevn.com / Admin123456');
  console.log('   User1: user1@example.com / User123456');
  console.log('   User2: user2@example.com / User123456');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
