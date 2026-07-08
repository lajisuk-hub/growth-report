import './globals.css';

export const metadata = {
  title: '우리 아이 성장 보고서 만들기',
  description: '인터뷰에 답하면 AI가 문장을 다듬어 4쪽 성장 보고서(생활기록부)를 만들어 드려요',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
