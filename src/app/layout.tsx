import type { Metadata } from "next";
import { Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

const notoSansMyanmar = Noto_Sans_Myanmar({
    subsets: ["myanmar"],
    variable: '--font-myanmar',
    weight: ['400', '700'],
});

export const metadata: Metadata = {
    title: "Myanmar Word Segmentation Editor",
    description: "A specialized annotation tool for creating high-quality Myanmar word segmentation datasets",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${notoSansMyanmar.variable} antialiased`}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
