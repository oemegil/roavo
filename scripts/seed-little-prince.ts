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

    const startDate = utcDate(2026, 9, 12);
    const endDate = utcDate(2026, 9, 14);

    const existingTrip = await prisma.trip.findFirst({
      where: {
        ownerId: userId,
        title: "Kapadokya’da üç gün",
        deletedAt: null,
      },
    });

    if (existingTrip) {
      await prisma.trip.update({
        where: { id: existingTrip.id },
        data: {
          visibility: "PUBLIC",
          status: "DRAFT",
          deletedAt: null,
        },
      });
      console.log("Public trip already exists:", existingTrip.id);
    } else {
      const trip = await prisma.trip.create({
        data: {
          ownerId: userId,
          title: "Kapadokya’da üç gün",
          description:
            "Balonlar, peri bacaları ve yavaş bir keşif. Little Prince’in not defterinden.",
          status: "DRAFT",
          visibility: "PUBLIC",
          originName: "İstanbul",
          originCountryCode: "TR",
          destinationName: "Kapadokya",
          destinationCountryCode: "TR",
          destinationRegionNameSnapshot: "İç Anadolu",
          destinationSource: "MANUAL",
          startDate,
          endDate,
          travelerCount: 1,
          currencyCode: "TRY",
          travelPace: "RELAXED",
          interests: ["HISTORY", "NATURE", "PHOTOGRAPHY"],
          days: {
            create: [
              {
                date: startDate,
                title: "Göreme ve peri bacaları",
                notes: "Sabah yavaş başla; öğleden sonra vadide yürüyüş.",
                position: 0,
                items: {
                  create: [
                    {
                      type: "NOTE",
                      title: "O gün neler yaptım",
                      description:
                        "Göreme açık hava müzesini gez, sonra Love Valley’e doğru kısa bir yürüyüş yap. Akşam Günbatımı Noktası’nda çay iç.",
                      position: 0,
                      source: "MANUAL",
                    },
                    {
                      type: "ATTRACTION",
                      title: "Göreme Açık Hava Müzesi",
                      description: "Kayaya oyulmuş kiliseler ve freskler.",
                      locationName: "Göreme",
                      position: 1,
                      source: "MANUAL",
                    },
                  ],
                },
              },
              {
                date: utcDate(2026, 9, 13),
                title: "Uçhisar ve yeraltı",
                notes: "Kale manzarası + yeraltı şehri.",
                position: 1,
                items: {
                  create: [
                    {
                      type: "NOTE",
                      title: "O gün neler yaptım",
                      description:
                        "Sabah Uçhisar Kalesi’ne çık. Öğleden sonra Kaymaklı veya Derinkuyu yeraltı şehrini gez. Akşam Avanos’ta seramik atölyesine uğra.",
                      position: 0,
                      source: "MANUAL",
                    },
                  ],
                },
              },
              {
                date: endDate,
                title: "Balon sabahı ve vedalar",
                notes: "Erken kalk; gökyüzünü izle.",
                position: 2,
                items: {
                  create: [
                    {
                      type: "NOTE",
                      title: "O gün neler yaptım",
                      description:
                        "Şafakta balonları izle (uçmasan da manzara yeter). Öğleden sonra Paşabağ’da kısa bir tur atıp İstanbul’a dön.",
                      position: 0,
                      source: "MANUAL",
                    },
                  ],
                },
              },
            ],
          },
        },
      });
      console.log("Created public trip:", trip.id);
    }

    console.log("\nLogin:");
    console.log(`  email:    ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
    console.log(`  name:     ${DISPLAY_NAME}`);
    console.log("Keşfet’te “Kapadokya’da üç gün” görünmeli.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
