import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowBack — Post-Purchase Settlement Wallet on XRPL",
  description:
    "환불·보상·재구매 혜택을 하나의 스테이블코인 월렛으로 연결하는 글로벌 커머스 사후 정산 플랫폼.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
