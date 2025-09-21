import '../styles/globals.css';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}