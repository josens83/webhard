import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.download.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.fileTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.file.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eduvault.com',
      username: 'admin',
      password: hashedPassword,
      displayName: '관리자',
      isAdmin: true,
      isSeller: true,
      isVerified: true,
      cash: 1000000,
      point: 100000,
      couponCount: 50,
      stars: 100,
      membershipLevel: 'VIP',
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: 'seller1@eduvault.com',
      username: 'seller1',
      password: hashedPassword,
      displayName: '인기판매자',
      isSeller: true,
      isVerified: true,
      cash: 500000,
      point: 50000,
      couponCount: 20,
      stars: 50,
      membershipLevel: 'GOLD',
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@eduvault.com',
      username: 'seller2',
      password: hashedPassword,
      displayName: '신규판매자',
      isSeller: true,
      isVerified: true,
      cash: 100000,
      point: 10000,
      couponCount: 5,
      stars: 10,
      membershipLevel: 'SILVER',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@eduvault.com',
      username: 'testuser',
      password: hashedPassword,
      displayName: '일반사용자',
      isVerified: true,
      cash: 50000,
      point: 5000,
      couponCount: 3,
      stars: 5,
      membershipLevel: 'FREE',
    },
  });

  // Create more test users
  const users = [adminUser, seller1, seller2, regularUser];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@test.com`,
        username: `user${i}`,
        password: hashedPassword,
        displayName: `테스트유저${i}`,
        isVerified: true,
        cash: Math.floor(Math.random() * 100000),
        point: Math.floor(Math.random() * 10000),
        couponCount: Math.floor(Math.random() * 10),
        stars: Math.floor(Math.random() * 20),
      },
    });
    users.push(user);
  }

  // Create categories
  console.log('📁 Creating categories...');
  const movieCategory = await prisma.category.create({
    data: {
      name: '영화',
      slug: 'movie',
      icon: '🎬',
      description: '최신 영화 및 고전 영화',
      order: 1,
    },
  });

  const dramaCategory = await prisma.category.create({
    data: {
      name: '드라마',
      slug: 'drama',
      icon: '📺',
      description: 'TV 드라마 시리즈',
      order: 2,
    },
  });

  const animeCategory = await prisma.category.create({
    data: {
      name: '애니메이션',
      slug: 'anime',
      icon: '🎨',
      description: '일본 애니메이션',
      order: 3,
    },
  });

  const gameCategory = await prisma.category.create({
    data: {
      name: '게임',
      slug: 'game',
      icon: '🎮',
      description: 'PC 및 콘솔 게임',
      order: 4,
    },
  });

  const musicCategory = await prisma.category.create({
    data: {
      name: '음악',
      slug: 'music',
      icon: '🎵',
      description: '음악 및 앨범',
      order: 5,
    },
  });

  const bookCategory = await prisma.category.create({
    data: {
      name: '도서',
      slug: 'book',
      icon: '📚',
      description: '전자책 및 문서',
      order: 6,
    },
  });

  const educationCategory = await prisma.category.create({
    data: {
      name: '교육',
      slug: 'education',
      icon: '🎓',
      description: '강의 및 교육 자료',
      order: 7,
    },
  });

  const softwareCategory = await prisma.category.create({
    data: {
      name: '소프트웨어',
      slug: 'software',
      icon: '💻',
      description: '프로그램 및 유틸리티',
      order: 8,
    },
  });

  const categories = [
    movieCategory,
    dramaCategory,
    animeCategory,
    gameCategory,
    musicCategory,
    bookCategory,
    educationCategory,
    softwareCategory,
  ];

  // Create tags
  console.log('🏷️  Creating tags...');
  const tagNames = [
    '액션', '코미디', '로맨스', '스릴러', '호러', 'SF', '판타지', '드라마',
    '애니메이션', '다큐멘터리', '전쟁', '범죄', '미스터리', '어드벤처', '가족',
    '음악', '전기', '역사', '서부', '무술', '스포츠', 'HD', '4K', 'Full HD',
    '한글자막', '영어자막', '더빙', '무자막', '2024', '2023', '고전',
  ];

  const tags = [];
  for (const tagName of tagNames) {
    const tag = await prisma.tag.create({
      data: {
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
      },
    });
    tags.push(tag);
  }

  // Create files
  console.log('📄 Creating files...');
  const fileTemplates = [
    {
      title: '[최신] 어벤져스: 엔드게임 (2019) 4K HDR',
      description: '마블 시네마틱 유니버스의 완결편. 타노스에게 패배한 후 어벤져스가 다시 모여 최후의 전투를 벌입니다.',
      category: movieCategory.id,
      price: 3000,
      tags: ['액션', 'SF', '4K', '한글자막', '2019'],
    },
    {
      title: '기생충 (Parasite, 2019) 감독판',
      description: '봉준호 감독의 아카데미 작품상 수상작. 계급 간의 갈등을 그린 블랙 코미디.',
      category: movieCategory.id,
      price: 2500,
      tags: ['드라마', '스릴러', 'HD', '한글자막'],
    },
    {
      title: '오징어 게임 시즌 1 전편 (2021)',
      description: '생존 게임을 다룬 한국 드라마. 넷플릭스 최고 조회수 기록.',
      category: dramaCategory.id,
      price: 5000,
      tags: ['드라마', '스릴러', '한글자막', '2021'],
    },
    {
      title: '귀멸의 칼날 극장판 무한열차편 (2020)',
      description: '일본 애니메이션 영화 역대 최고 흥행작.',
      category: animeCategory.id,
      price: 2000,
      tags: ['애니메이션', '액션', 'Full HD', '한글자막'],
    },
    {
      title: '원피스 전편 (1999-2024) 1000화 이상',
      description: '세계 최고의 해적왕을 꿈꾸는 루피의 모험',
      category: animeCategory.id,
      price: 15000,
      tags: ['애니메이션', '어드벤처', 'HD'],
    },
    {
      title: 'GTA V Grand Theft Auto 5 완전판',
      description: '락스타 게임즈의 오픈월드 액션 게임',
      category: gameCategory.id,
      price: 10000,
      tags: ['액션', '어드벤처', '오픈월드'],
    },
    {
      title: '사이버펑크 2077 + 모든 DLC',
      description: 'CD 프로젝트 레드의 RPG 게임',
      category: gameCategory.id,
      price: 12000,
      tags: ['RPG', 'SF', '액션'],
    },
    {
      title: 'BTS 정규앨범 전곡 (2013-2024)',
      description: '방탄소년단 모든 앨범 고음질 FLAC',
      category: musicCategory.id,
      price: 8000,
      tags: ['K-POP', '음악', 'FLAC'],
    },
    {
      title: '해리포터 시리즈 전권 (1-7권) 전자책',
      description: 'J.K. 롤링의 판타지 소설 시리즈',
      category: bookCategory.id,
      price: 20000,
      tags: ['판타지', '전자책', 'PDF'],
    },
    {
      title: '코딩 부트캠프 - 풀스택 웹개발 강의 (50시간)',
      description: 'HTML, CSS, JavaScript, React, Node.js 완벽 강의',
      category: educationCategory.id,
      price: 30000,
      tags: ['교육', '프로그래밍', 'Web Development'],
    },
    {
      title: '포토샵 CC 2024 + 플러그인 모음',
      description: 'Adobe Photoshop 최신버전 및 유용한 플러그인',
      category: softwareCategory.id,
      price: 15000,
      tags: ['그래픽', '편집', '디자인'],
    },
    {
      title: '마이크로소프트 오피스 2024 프로페셔널',
      description: 'MS Office 전체 패키지 (Word, Excel, PowerPoint)',
      category: softwareCategory.id,
      price: 25000,
      tags: ['오피스', '생산성'],
    },
  ];

  const files = [];
  for (let i = 0; i < fileTemplates.length; i++) {
    const template = fileTemplates[i];
    const uploader = i % 2 === 0 ? seller1 : seller2;
    const fileSize = BigInt(Math.floor(Math.random() * 5000000000) + 100000000); // 100MB ~ 5GB

    const file = await prisma.file.create({
      data: {
        title: template.title,
        description: template.description,
        fileName: `${template.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.zip`,
        fileSize,
        mimeType: 'application/zip',
        fileExtension: 'zip',
        storagePath: `/uploads/${Date.now()}_${i}.zip`,
        price: template.price,
        priceType: template.price > 0 ? 'CASH' : 'FREE',
        uploaderId: uploader.id,
        categoryId: template.category,
        status: 'APPROVED',
        publishedAt: new Date(),
        downloadCount: Math.floor(Math.random() * 5000),
        viewCount: Math.floor(Math.random() * 10000),
        favoriteCount: Math.floor(Math.random() * 500),
        ratingAverage: Math.random() * 2 + 3, // 3.0 ~ 5.0
        ratingCount: Math.floor(Math.random() * 200) + 10,
        tags: {
          create: template.tags.map(tagName => {
            const tag = tags.find(t => t.name === tagName);
            return { tagId: tag!.id };
          }),
        },
      },
    });
    files.push(file);
  }

  // Create some free files
  for (let i = 0; i < 5; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const file = await prisma.file.create({
      data: {
        title: `[무료] 샘플 파일 ${i + 1} - ${category.name}`,
        description: '무료로 제공되는 샘플 파일입니다.',
        fileName: `free_sample_${i + 1}.zip`,
        fileSize: BigInt(Math.floor(Math.random() * 100000000)),
        mimeType: 'application/zip',
        fileExtension: 'zip',
        storagePath: `/uploads/free_${Date.now()}_${i}.zip`,
        price: 0,
        priceType: 'FREE',
        uploaderId: seller1.id,
        categoryId: category.id,
        status: 'APPROVED',
        publishedAt: new Date(),
        downloadCount: Math.floor(Math.random() * 10000),
        viewCount: Math.floor(Math.random() * 20000),
        favoriteCount: Math.floor(Math.random() * 1000),
        ratingAverage: Math.random() * 2 + 3,
        ratingCount: Math.floor(Math.random() * 500),
      },
    });
    files.push(file);
  }

  // Create comments
  console.log('💬 Creating comments...');
  for (const file of files.slice(0, 8)) {
    // Create parent comments
    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const comments = [
        '정말 좋은 자료네요! 감사합니다.',
        '화질이 너무 좋아요. 추천합니다!',
        '기대했던 것보다 훨씬 좋네요.',
        '가격 대비 만족스러운 자료입니다.',
        '다운로드 속도도 빠르고 좋습니다.',
        '별로예요. 기대 이하입니다.',
        '꼭 필요한 자료였는데 감사합니다!',
        '계속 이런 자료 올려주세요.',
      ];

      const parentComment = await prisma.comment.create({
        data: {
          content: comments[Math.floor(Math.random() * comments.length)],
          userId: user.id,
          fileId: file.id,
        },
      });

      // Create replies
      if (Math.random() > 0.5) {
        const replier = users[Math.floor(Math.random() * users.length)];
        await prisma.comment.create({
          data: {
            content: '감사합니다! 좋은 하루 되세요.',
            userId: replier.id,
            fileId: file.id,
            parentId: parentComment.id,
          },
        });
      }
    }
  }

  // Create ratings
  console.log('⭐ Creating ratings...');
  for (const file of files) {
    const numRatings = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < numRatings; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      try {
        await prisma.rating.create({
          data: {
            rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
            userId: user.id,
            fileId: file.id,
          },
        });
      } catch (error) {
        // Skip if duplicate
      }
    }
  }

  // Create purchases
  console.log('💰 Creating purchases...');
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const file = files[Math.floor(Math.random() * files.length)];

    if (file.price > 0) {
      try {
        await prisma.purchase.create({
          data: {
            userId: user.id,
            fileId: file.id,
            price: file.price,
            priceType: 'CASH',
          },
        });
      } catch (error) {
        // Skip if duplicate
      }
    }
  }

  // Create favorites
  console.log('❤️  Creating favorites...');
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const file = files[Math.floor(Math.random() * files.length)];

    try {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          fileId: file.id,
        },
      });
    } catch (error) {
      // Skip if duplicate
    }
  }

  // Create coupons
  console.log('🎫 Creating coupons...');
  await prisma.coupon.create({
    data: {
      code: 'WELCOME2024',
      name: '신규가입 환영 쿠폰',
      description: '신규 회원을 위한 특별 할인 쿠폰',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 5000,
      maxDiscount: 10000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 1000,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'SUMMER50',
      name: '여름 특가 쿠폰',
      description: '여름 시즌 특별 할인',
      discountType: 'FIXED_AMOUNT',
      discountValue: 5000,
      minPurchase: 10000,
      validFrom: new Date('2024-06-01'),
      validUntil: new Date('2024-08-31'),
      usageLimit: 500,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'VIP100',
      name: 'VIP 회원 전용 쿠폰',
      description: 'VIP 등급 회원만 사용 가능',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      minPurchase: 20000,
      maxDiscount: 50000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
    },
  });

  // Create banners
  console.log('🎨 Creating banners...');
  await prisma.banner.create({
    data: {
      title: '신규 가입 이벤트',
      imageUrl: '/images/banners/welcome.jpg',
      link: '/register',
      position: 'top',
      order: 1,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      viewCount: Math.floor(Math.random() * 10000),
      clickCount: Math.floor(Math.random() * 1000),
    },
  });

  await prisma.banner.create({
    data: {
      title: '여름 시즌 특가',
      imageUrl: '/images/banners/summer-sale.jpg',
      link: '/files?event=summer',
      position: 'sidebar',
      order: 1,
      validFrom: new Date('2024-06-01'),
      validUntil: new Date('2024-08-31'),
      viewCount: Math.floor(Math.random() * 5000),
      clickCount: Math.floor(Math.random() * 500),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Created:');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${tags.length} tags`);
  console.log(`  - ${files.length} files`);
  console.log('\n🔑 Test accounts:');
  console.log('  - Admin: admin@eduvault.com / password123');
  console.log('  - Seller 1: seller1@eduvault.com / password123');
  console.log('  - Seller 2: seller2@eduvault.com / password123');
  console.log('  - User: user@eduvault.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
