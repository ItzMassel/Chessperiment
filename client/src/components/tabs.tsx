import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image';

export function TabsWithIconsExample() {
    return (
        <Tabs defaultValue="board" className="bg-">
            <TabsList>
                <TabsTrigger value="board">
                    <Image src="/chessboard.svg" alt="Chessboard" width={24} height={24} />
                    Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                    <Image src="/pawn.svg" alt="Pawn" width={24} height={24} />
                    Code
                </TabsTrigger>
                <TabsTrigger value="design">
                    <Image src="/design.svg" alt="Design" width={24} height={24} />
                    Design
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
