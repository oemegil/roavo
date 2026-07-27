-- CreateTable
CREATE TABLE "trip_stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT,
    "iataCode" TEXT,
    "destinationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_quotes" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "outboundOrigin" TEXT NOT NULL,
    "outboundDest" TEXT NOT NULL,
    "outboundDate" DATE NOT NULL,
    "returnOrigin" TEXT NOT NULL,
    "returnDest" TEXT NOT NULL,
    "returnDate" DATE NOT NULL,
    "entryCityName" TEXT NOT NULL,
    "exitCityName" TEXT NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "priceCurrency" TEXT NOT NULL,
    "priceStatus" TEXT NOT NULL DEFAULT 'verified',
    "ignavId" TEXT,
    "routeSummary" TEXT NOT NULL,
    "carrierSummary" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_stops_tripId_position_idx" ON "trip_stops"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "flight_quotes_tripId_key" ON "flight_quotes"("tripId");

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_quotes" ADD CONSTRAINT "flight_quotes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
