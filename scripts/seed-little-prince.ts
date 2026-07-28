/**
 * One-off demo seed: Little Prince user + a public trip for Keşfet.
 * Usage: pnpm exec tsx scripts/seed-little-prince.ts
 */
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const EMAIL = "little.prince@roavo.demo";
const PASSWORD = "prince1234";
const USERNAME = "littleprince";
const DISPLAY_NAME = "Little Prince";
const TRIP_TITLE = "Dünyada bir gün";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} as const;

function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL / DIRECT_URL missing");
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const passwordHash = await hash(PASSWORD, ARGON2_OPTIONS);
    const emailNormalized = EMAIL.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { emailNormalized },
      include: { profile: true },
    });

    let userId: string;
    if (existing) {
      userId = existing.id;
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: "ACTIVE",
          deletedAt: null,
          travelerScoreMinor: 80,
        },
      });
      if (existing.profile) {
        await prisma.userProfile.update({
          where: { userId },
          data: {
            username: USERNAME,
            usernameNormalized: USERNAME,
            displayName: DISPLAY_NAME,
            bio: "Küçük bir gezegen, büyük bir merak.",
          },
        });
      }
      console.log("Updated existing user:", EMAIL);
    } else {
      const user = await prisma.user.create({
        data: {
          email: EMAIL,
          emailNormalized,
          passwordHash,
          status: "ACTIVE",
          role: "USER",
          travelerScoreMinor: 80,
          profile: {
            create: {
              username: USERNAME,
              usernameNormalized: USERNAME,
              displayName: DISPLAY_NAME,
              bio: "Küçük bir gezegen, büyük bir merak.",
              travelPreferences: {},
            },
          },
        },
      });
      userId = user.id;
      console.log("Created user:", EMAIL);
    }

    // Soft-delete old demo trips so Keşfet only shows the new story.
    await prisma.trip.updateMany({
      where: {
        ownerId: userId,
        deletedAt: null,
        title: { not: TRIP_TITLE },
      },
      data: { deletedAt: new Date(), visibility: "PRIVATE" },
    });

    const startDate = utcDate(2026, 8, 1);
    const midDate = utcDate(2026, 8, 2);
    const endDate = utcDate(2026, 8, 3);

    let trip = await prisma.trip.findFirst({
      where: {
        ownerId: userId,
        title: TRIP_TITLE,
        deletedAt: null,
      },
      include: { days: true },
    });

    if (trip) {
      await prisma.itineraryItem.deleteMany({
        where: { tripDay: { tripId: trip.id } },
      });
      await prisma.tripDay.deleteMany({ where: { tripId: trip.id } });
      await prisma.tripComment.deleteMany({ where: { tripId: trip.id } });
      trip = await prisma.trip.update({
        where: { id: trip.id },
        data: {
          description:
            "Üç gün, üç kıta, üç gün batımı. Aynı gökyüzünü farklı ufuklardan izlemek için küçük bir rota.",
          status: "DRAFT",
          visibility: "PUBLIC",
          originName: "Tokyo",
          originCountryCode: "JP",
          destinationName: "Dünya",
          destinationCountryCode: null,
          destinationRegionNameSnapshot: "Tokyo · Santorini · Havana",
          destinationSource: "MANUAL",
          startDate,
          endDate,
          travelerCount: 1,
          currencyCode: "USD",
          travelPace: "RELAXED",
          interests: ["NATURE", "PHOTOGRAPHY", "CULTURE"],
          likeCount: 0,
          commentCount: 0,
        },
        include: { days: true },
      });
      console.log("Reset existing trip:", trip.id);
    } else {
      trip = await prisma.trip.create({
        data: {
          ownerId: userId,
          title: TRIP_TITLE,
          description:
            "Üç gün, üç kıta, üç gün batımı. Aynı gökyüzünü farklı ufuklardan izlemek için küçük bir rota.",
          status: "DRAFT",
          visibility: "PUBLIC",
          originName: "Tokyo",
          originCountryCode: "JP",
          destinationName: "Dünya",
          destinationRegionNameSnapshot: "Tokyo · Santorini · Havana",
          destinationSource: "MANUAL",
          startDate,
          endDate,
          travelerCount: 1,
          currencyCode: "USD",
          travelPace: "RELAXED",
          interests: ["NATURE", "PHOTOGRAPHY", "CULTURE"],
        },
        include: { days: true },
      });
      console.log("Created trip:", trip.id);
    }

    await prisma.tripDay.create({
      data: {
        tripId: trip.id,
        date: startDate,
        title: "Tokyo — Shibuya gün batımı",
        notes: "Şehrin neonları yanmadan önce gökyüzü turuncuya döner.",
        position: 0,
        items: {
          create: [
            {
              type: "NOTE",
              title: "O gün neler yaptım",
              description:
                "Öğleden sonra Yoyogi Park’ta yürüdüm. Akşamüstü Shibuya Sky’a çıktım ve gün batımını tüm şehrin üzerinde izledim. Küçük prens dese ki: ‘Işıklar yanmadan önce dünya daha yumuşak.’",
              position: 0,
              source: "MANUAL",
            },
            {
              type: "ATTRACTION",
              title: "Shibuya Sky gün batımı",
              description: "Tokyo’nun üzerinde yavaş yavaş kararan bir ufuk.",
              locationName: "Shibuya, Tokyo",
              position: 1,
              source: "MANUAL",
            },
          ],
        },
      },
    });

    await prisma.tripDay.create({
      data: {
        tripId: trip.id,
        date: midDate,
        title: "Santorini — Oia’nın kırmızı ufku",
        notes: "Beyaz duvarlar, mavi kubbeler, yavaş bir akşam.",
        position: 1,
        items: {
          create: [
            {
              type: "NOTE",
              title: "O gün neler yaptım",
              description:
                "Sabah Fira’dan Oia’ya yürüdüm. Akşam kalabalığa karışmadan bir terasta oturdum; Ege’nin üstünde gün batımı neredeyse bir saat sürdü. Hiçbir şey yapmadan izlemek bile planın kendisiydi.",
              position: 0,
              source: "MANUAL",
            },
            {
              type: "ATTRACTION",
              title: "Oia gün batımı",
              description: "Klasik ama her seferinde yeni hissettiren bir ışık.",
              locationName: "Oia, Santorini",
              position: 1,
              source: "MANUAL",
            },
          ],
        },
      },
    });

    await prisma.tripDay.create({
      data: {
        tripId: trip.id,
        date: endDate,
        title: "Havana — Malecón’da veda",
        notes: "Müzik, tuzlu rüzgâr, kararan Karayipler.",
        position: 2,
        items: {
          create: [
            {
              type: "NOTE",
              title: "O gün neler yaptım",
              description:
                "Öğleden sonra eski şehirde dolaştım. Akşam Malecón’a oturdum; dalgalar duvara çarparken güneş denize indi. Üçüncü gün batımı, aynı soruyu sordurdu: belki dünya tek bir gündür, sadece farklı balkonlardan bakıyoruz.",
              position: 0,
              source: "MANUAL",
            },
            {
              type: "ATTRACTION",
              title: "Malecón gün batımı",
              description: "Havana’nın sahil yolunda yavaş bir kapanış.",
              locationName: "Malecón, Havana",
              position: 1,
              source: "MANUAL",
            },
          ],
        },
      },
    });

    // Seed a couple of demo comments from another user if present.
    const other = await prisma.user.findFirst({
      where: {
        emailNormalized: { not: emailNormalized },
        status: "ACTIVE",
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
    if (other) {
      await prisma.tripComment.createMany({
        data: [
          {
            tripId: trip.id,
            userId: other.id,
            body: "Santorini gün batımı sahnesi çok iyi anlatılmış. Ben de Oia’da aynı terasta oturmuştum.",
          },
          {
            tripId: trip.id,
            userId: other.id,
            body: "Tokyo → Havana arası aynı gökyüzü fikri güzel. Malecón notunu kaydettim.",
          },
        ],
      });
      await prisma.trip.update({
        where: { id: trip.id },
        data: { commentCount: 2 },
      });
      console.log("Seeded 2 comments from", other.email);
    }

    console.log("\nLogin:");
    console.log(`  email:    ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
    console.log(`  name:     ${DISPLAY_NAME}`);
    console.log(`Keşfet’te “${TRIP_TITLE}” görünmeli.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
