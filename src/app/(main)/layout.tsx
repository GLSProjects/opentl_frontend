import Sidebar from "@/components/Sidebar";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-zinc-900 text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 ml-[72px] flex">
                {children}
            </div>
        </div>
    );
}