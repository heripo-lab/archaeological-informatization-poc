import { ReactNode } from 'react';
import './globals.css'; // 전역 스타일을 위한 CSS 파일

export const metadata = {
  title: 'Archaeological Informatization PoC',
  description: 'Proof of Concept for Archaeological Informatization',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
