import { Square } from 'ldrs/react'
import Link from 'next/link'
import 'ldrs/react/Square.css'
import { bungee } from "@/lib/fonts";

export default function Loading() {
    return (
        <div className="w-screen h-screen flex items-center flex-col mt-[30vh] gap-10">
            <Link href="/" className={`${bungee.className} text-amber-400 text-amber-500 [font-variant-caps:small-caps] ml-1.5 lg:ml-0 text-9xl caret-transparent`}>chessperiment</Link>
            <Square
                size="80"
                stroke="6"
                strokeLength="0.25"
                bgOpacity="0.22"
                speed="1.2"
                color="rgb(115,117,0)"
            />
        </div>
    )
}
