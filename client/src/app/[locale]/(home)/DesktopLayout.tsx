export default function DesktopLayout({
    children, statistics, mixed
}: Readonly<{
    children: React.ReactNode;
    statistics: React.ReactNode;
    mixed: React.ReactNode;
}>) {
    return (
        <main
            className="mt-0 px-10 pb-20"
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1fr",
                gridTemplateAreas: `
        "statistics main mixed"
        `,
                gap: "40px",
                minHeight: "100vh"
            }}
        >
            <div className="block h-3"></div>
            <div className="h-1 w-full mb-9"></div>
            <section style={{ gridArea: "main" }}
                className='bg-islands transition-all duration-300 shadow-islands min-h-[440px] p-6 rounded-lg h-fit'>{children}</section>
            <aside style={{ gridArea: "statistics" }}
                className='bg-islands h-fit'>{statistics}</aside>
            <aside style={{ gridArea: "mixed" }}
                className='bg-islands h-fit'>{mixed}</aside>
        </main>
    );
}