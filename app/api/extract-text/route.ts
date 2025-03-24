import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

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

    const buffer = await response.arrayBuffer();
    let text = '';

    // 파일 유형에 따라 텍스트 추출
    switch (fileType.toLowerCase()) {
      case 'pdf':
        const pdfData = await pdf(Buffer.from(buffer));
        text = pdfData.text;
        break;

      case 'docx':
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        console.log("docx loaded sucessfully")
        text = result.value;
        break;

      case 'txt':
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(buffer);
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: error.message || "Failed to extract text" },
      { status: 500 }
    );
  }
} 