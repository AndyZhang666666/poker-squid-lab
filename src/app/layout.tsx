import type { Metadata } from 'next';
import '../styles/globals.css';
export const metadata: Metadata = {
  title: '鱿鱼博弈实验室 · Squid Lab',
  description:
    '同样一手牌，换一种规则，争夺它的价值为什么变了？有限与无限鱿鱼的互动比较、规则回放和局面挑战。',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-palette="frost" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=localStorage.getItem('palette');if(['frost','mist','copper','indigo'].includes(p))document.documentElement.dataset.palette=p}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
