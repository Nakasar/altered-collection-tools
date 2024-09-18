import SideBar from "@/app/(app)/settings/SideBar";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <>
      <SideBar />

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
