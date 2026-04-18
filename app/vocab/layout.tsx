import { VocabBoardProvider } from "@/components/vocab/VocabBoardProvider";

export default function VocabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <VocabBoardProvider>{children}</VocabBoardProvider>;
}
