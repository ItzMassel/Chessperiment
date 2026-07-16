import type { Metadata } from "next";

export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "Chessperiment | Custom Chess Sandbox",
    description: "Create your own chess world. Design pieces, boards and play online.",
    images: ["/images/seo/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
