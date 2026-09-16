import Sidebar from "@/components/Sidebar";
import ChannelList from "@/components/ChannelList";

export default async function ServerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ serverId: string }>;
}) {
    const { serverId } = await params;

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar />

            <div className="flex flex-1 md:ml-[72px] ml-0">
                <ChannelList serverId={serverId} />

                <main className="flex-1 bg-[#313338] overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}