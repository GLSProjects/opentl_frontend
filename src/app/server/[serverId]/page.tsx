import { redirect } from "next/navigation";

export default async function ServerPage({
    params,
}: {
    params: Promise<{ serverId: string }>;
}) {
    const { serverId } = await params;
    redirect(`/server/${serverId}/channel/general`);
}