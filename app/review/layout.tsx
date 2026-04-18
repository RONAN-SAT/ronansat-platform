import { VocabBoardProvider } from "@/components/vocab/VocabBoardProvider";

export default function ReviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <VocabBoardProvider>{children}</VocabBoardProvider>;
}
