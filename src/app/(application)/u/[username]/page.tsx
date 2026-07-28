import { PublicTravelerProfileClient } from "@/features/traveler/components/public-traveler-profile";

export const metadata = {
  title: "Gezgin",
};

type Params = { params: Promise<{ username: string }> };

export default async function TravelerProfilePage({ params }: Params) {
  const { username } = await params;
  return <PublicTravelerProfileClient username={username} />;
}
