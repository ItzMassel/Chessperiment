
export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return <main style={{ gridArea: "main" }}
        className='bg-islands shadow-islands min-h-[410px] h-auto flex flex-col items-center justify-center pb-20'>{children}
    </main>
}