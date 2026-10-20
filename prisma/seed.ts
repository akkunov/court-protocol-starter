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

  const template = await prisma.protocolTemplate.upsert({
    where: {
      key_version_proceedingCode_language: {
        key: 'apc-default',
        version: 1,
        proceedingCode: 'APC',
        language: 'ru',
      },
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      key: 'apc-default',
      version: 1,
      proceedingCode: 'APC',
      language: 'ru',
      legalProfileId: profile.id,
      storageKey: 'templates/apc-default.docx',
      structure: {
        title: 'Судебный протокол',
        sections: ['Сведения о деле', 'Участники', 'Ход заседания', 'Заявления и ходатайства', 'Решения суда'],
      },
      isActive: true,
    },
  });

  const protocol = await prisma.protocolDocument.upsert({
    where: {
      hearingId_kind_version: {
        hearingId: hearing.id,
        kind: 'FULL_WRITTEN',
        version: 1,
      },
    },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      hearingId: hearing.id,
      templateId: template.id,
      version: 1,
      kind: 'FULL_WRITTEN',
      status: 'DRAFT',
      content: {
        heading: 'Судебный протокол — черновик',
        notice: 'Демонстрационный шаблон. Заполните фактические сведения и проверьте их перед использованием.',
        sections: [
          { title: 'Сведения о деле', text: 'Заполнить номер, дату и состав суда.' },
          { title: 'Участники', text: 'Заполнить данные и явку участников.' },
          { title: 'Ход заседания', text: 'Вставить и проверить текстовую расшифровку.' },
          { title: 'Заявления и ходатайства', text: 'Заполнить по материалам заседания.' },
          { title: 'Решения суда', text: 'Заполнить только по подтверждённым сведениям.' },
        ],
      },
      legalRuleSnapshot: { profile: 'APC', version: '2026-10-14', demo: true },
      createdById: user.id,
    },
  });

  console.log('Seed completed', {
    profileId: profile.id,
    userId: user.id,
    caseId: courtCase.id,
    hearingId: hearing.id,
    templateId: template.id,
    protocolId: protocol.id,
  });
}

main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });