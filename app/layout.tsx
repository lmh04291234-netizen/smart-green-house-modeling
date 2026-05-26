import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Greenhouse Studio",
  description: "스마트 온실 모델링 과제 공유 플랫폼"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
