import { FollowListClient } from "@/features/traveler/components/follow-list";

export const metadata = {
  title: "Takipçiler",
};

type Params = { params: Promise<{ username: string }> };

export default async function FollowersPage({ params }: Params) {
  const { username } = await params;
  return <FollowListClient username={username} direction="followers" />;
}
