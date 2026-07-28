import { FollowListClient } from "@/features/traveler/components/follow-list";

export const metadata = {
  title: "Takip",
};

type Params = { params: Promise<{ username: string }> };

export default async function FollowingPage({ params }: Params) {
  const { username } = await params;
  return <FollowListClient username={username} direction="following" />;
}
