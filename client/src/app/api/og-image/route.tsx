
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('room')?.toUpperCase() || 'UNKNOWN';
        const gameStatus = searchParams.get('status') || 'Playing'; // e.g., "Playing", "Ended", "Draw"

        // Load custom font
        const fontData = await fetch(
            new URL('/fonts/Rockwell Regular.otf', req.url)
        ).then((res) => res.arrayBuffer());

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0a0a0a', // Dark background
                        color: '#f0f0f0', // Light text
                        fontFamily: '"Rockwell"',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background pattern */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'radial-gradient(circle, #262626 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            opacity: 0.3,
                        }}
                    />

                    {/* Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            padding: '40px',
                            textAlign: 'center',
                        }}
                    >
                        <img
                            src="https://chessperiment.app/design.svg" // Assuming design.svg is a logo
                            alt="chessperiment Logo"
                            width={150}
                            height={150}
                            style={{ marginBottom: '20px' }}
                        />
                        <p style={{ fontSize: 60, fontWeight: 'bold', margin: '0 0 10px 0' }}>
                            chessperiment Game
                        </p>
                        <p style={{ fontSize: 40, margin: '0', color: '#ffd700' }}>
                            Room: {roomId}
                        </p>
                        {gameStatus && gameStatus !== 'Playing' && (
                            <p style={{ fontSize: 30, margin: '15px 0 0 0', color: '#10b981' }}>
                                Status: {gameStatus}
                            </p>
                        )}
                        <p style={{ fontSize: 24, margin: '30px 0 0 0', opacity: 0.7 }}>
                            Join the game at chessperiment.app
                        </p>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Rockwell',
                        data: fontData,
                        style: 'normal',
                    },
                ],
            }
        );
    } catch (e: any) {
        console.error(e.message);
        return new Response(`Failed to generate image: ${e.message}`, {
            status: 500,
        });
    }
}
