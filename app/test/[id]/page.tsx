import { Suspense } from "react";   // Công cụ hiện phòng chờ khi data chưa tải xong để k phải hiện 1 trang trắng tinh
import Script from "next/script";   // Nhúng các công cụ từ trang web khác vào ứng dụng 1 cách an toàn và tôi ưu
 
import TestEngine from "@/components/TestEngine";
import { TestRoomAccessGate } from "@/components/test-access/TestRoomAccessGate";
import SimpleLoading from "@/components/SimpleLoading";
                                                               // <{ id: string }> -> Bến trong param phải chứa id dạng string
export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {    // Hãy chờ đi lấy đường dẫn và lấy id của param đó
  const { id } = await params;  // Destructuring, chỉ lấy id trong param

  return (
    <>
      <Script
        src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        strategy="lazyOnload"        // Ưu tiên tải bài thi trước, xong mới tải Desmos
      />
      {/** Hiện SimpleLoading trong lúc tải dữ liệu web */}
      <div className="fixed right-4 top-4 z-[100]" />   
      <Suspense fallback={<SimpleLoading />}>     
        <TestRoomAccessGate testId={id}>
          <TestEngine testId={id} />
        </TestRoomAccessGate>
      </Suspense>
    </>
  );
}
