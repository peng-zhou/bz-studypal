import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建基础科目数据
  const subjects = [
    {
      code: 'math',
      nameZh: '数学',
      nameEn: 'Mathematics',
      description: '数学相关错题',
      color: '#2196F3',
      order: 1,
    },
    {
      code: 'chinese',
      nameZh: '语文',
      nameEn: 'Chinese',
      description: '语文相关错题',
      color: '#FF5722',
      order: 2,
    },
    {
      code: 'english',
      nameZh: '英语',
      nameEn: 'English',
      description: '英语相关错题',
      color: '#4CAF50',
      order: 3,
    },
    {
      code: 'physics',
      nameZh: '物理',
      nameEn: 'Physics',
      description: '物理相关错题',
      color: '#9C27B0',
      order: 4,
    },
    {
      code: 'chemistry',
      nameZh: '化学',
      nameEn: 'Chemistry',
      description: '化学相关错题',
      color: '#FF9800',
      order: 5,
    },
    {
      code: 'biology',
      nameZh: '生物',
      nameEn: 'Biology',
      description: '生物相关错题',
      color: '#8BC34A',
      order: 6,
    },
    {
      code: 'history',
      nameZh: '历史',
      nameEn: 'History',
      description: '历史相关错题',
      color: '#795548',
      order: 7,
    },
    {
      code: 'geography',
      nameZh: '地理',
      nameEn: 'Geography',
      description: '地理相关错题',
      color: '#607D8B',
      order: 8,
    },
    {
      code: 'politics',
      nameZh: '政治',
      nameEn: 'Politics',
      description: '政治相关错题',
      color: '#E91E63',
      order: 9,
    },
    {
      code: 'other',
      nameZh: '其他',
      nameEn: 'Other',
      description: '其他科目错题',
      color: '#9E9E9E',
      order: 10,
    },
  ];

  console.log('开始种子数据初始化...');

  // 创建或更新科目
  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject,
    });
    console.log(`科目已创建/更新: ${subject.nameZh} (${subject.nameEn})`);
  }

  // 创建系统配置
  const systemConfigs = [
    {
      key: 'app_name',
      value: 'BZ StudyPal',
    },
    {
      key: 'app_version',
      value: '1.0.0',
    },
    {
      key: 'default_language',
      value: 'zh',
    },
    {
      key: 'supported_languages',
      value: JSON.stringify(['zh', 'en']),
    },
    {
      key: 'max_upload_size',
      value: '10485760', // 10MB
    },
    {
      key: 'allowed_file_types',
      value: JSON.stringify(['jpg', 'jpeg', 'png', 'gif', 'pdf']),
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
    console.log(`系统配置已创建/更新: ${config.key}`);
  }

  // 创建管理员用户（如果不存在）
  const adminEmail = 'admin@bzstudypal.com';
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        role: 'ADMIN',
        emailVerified: true,
        preferredLanguage: 'zh',
        status: 'ACTIVE',
      },
    });
    console.log(`管理员用户已创建: ${adminEmail}`);
  } else {
    console.log(`管理员用户已存在: ${adminEmail}`);
  }

  console.log('种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
