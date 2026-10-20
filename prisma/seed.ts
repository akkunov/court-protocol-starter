import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/api/src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Add it to .env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const profile = await prisma.legalProfile.upsert({
    where: { code_version: { code: 'APC', version: '2026-10-14' } },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'APC',
      version: '2026-10-14',
      sourceUrl: 'https://cbd.minjust.gov.kg/3-28/edition/1265033/ru',
      rules: {
        profile: 'APC',
        docxTemplate: 'apc-default',
      },
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'admin',
      displayName: 'Administrator',
      roleKey: 'admin',
      isActive: true,
    },
  });

  const courtCase = await prisma.courtCase.upsert({
    where: {
      courtName_caseNumber: {
        courtName: 'Бишкекский городской суд',
        caseNumber: '1-123/2026',
      },
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      caseNumber: '1-123/2026',
      title: 'Административное дело по заявлению о восстановлении прав',
      proceedingCode: 'APC',
      legalProfileId: profile.id,
      status: 'OPEN',
      courtName: 'Бишкекский городской суд',
      category: 'administrative',
      openedAt: new Date(),
    },
  });

  const hearing = await prisma.hearing.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      caseId: courtCase.id,
      instance: 'FIRST_INSTANCE',
      status: 'PLANNED',
      recordingMode: 'WRITTEN_PROTOCOL_WITH_AV',
      scheduledAt: new Date('2026-10-20T10:00:00.000Z'),
      timezone: 'Asia/Bishkek',
      presidingJudgeName: 'Сарымсакова А. А.',
      secretaryName: 'Иванова Н. П.',
      location: 'Зал заседаний №2',
      ruleSnapshot: { profile: 'APC', version: '2026-10-14' },
    },
  });

  console.log('Seed completed', { profileId: profile.id, userId: user.id, caseId: courtCase.id, hearingId: hearing.id });
}

main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });