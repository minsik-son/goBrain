
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
export async function POST(request: NextRequest) {
  try {
    console.log('extract-text API 호출됨');
    
    const body = await request.json();
    const { fileUrl, fileType } = body;
    
    console.log('요청 데이터:', { fileUrl, fileType });

    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "Missing fileUrl or fileType" },
        { status: 400 }
      );
    }

    // 파일 가져오기
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); // 수정된 코드 문제없으면 이걸로 고정

    //수정전코드 const buffer = await response.arrayBuffer();
    let text = '';
    let html = ''
    // 파일 유형에 따라 텍스트 추출
    
    switch (fileType.toLowerCase()) {
      // 현재 pdf가 404 에러 원인
      /*
      case 'pdf':
        const pdfData = await pdf(Buffer.from(buffer));
        text = pdfData.text;
        break;
      */
      case 'docx':
        const result = await mammoth.convertToHtml({ buffer });
        html = result.value;
        // HTML에서 텍스트만 추출
        const dom = new JSDOM(html);
        const docxText = dom.window.document.body.textContent || '';
        console.log("extract-text에서 내보내는 값: ",html, docxText)
        return NextResponse.json({ 
            html,               // 원본 HTML도 전달
            text: docxText      // 번역을 위해 필요한 텍스트만 따로 전달
          });
        
      case 'txt':
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(buffer);
        return NextResponse.json({ text });

      default:
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
    
    }

  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: error.message || "Failed to extract text" },
      { status: 500 }
    );
  }
} 
