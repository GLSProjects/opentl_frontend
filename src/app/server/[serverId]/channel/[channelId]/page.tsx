export default function ChannelPage({
    params,
}: {
    params: { serverId: string; channelId: string };
}) {
    return (
        <div className="h-full flex items-center justify-center text-xl">
            <div>
                <p className="text-gray-400 text-sm">Server</p>
                <h1 className="text-2xl font-bold">{params.serverId}</h1>

                <p className="text-gray-400 text-sm mt-6">Channel</p>
                <h2 className="text-xl font-semibold">#{params.channelId}</h2>
            </div>
        </div>
    );
}