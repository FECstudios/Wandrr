
import { ThemeProvider } from 'next-themes';

export default function Provider({ children }) {
  return <ThemeProvider attribute="data-theme">{children}</ThemeProvider>;
}
