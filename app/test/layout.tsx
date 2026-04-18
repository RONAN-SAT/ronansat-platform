import { VocabBoardProvider } from "@/components/vocab/VocabBoardProvider";

export default function TestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <VocabBoardProvider>{children}</VocabBoardProvider>;
}
