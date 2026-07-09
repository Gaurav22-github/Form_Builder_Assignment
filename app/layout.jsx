import "./globals.css";

export const metadata = {
  title: "Formcraft — build no-code forms in minutes",
  description:
    "Design custom forms with a no-code builder, share them, and collect responses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
