import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { DateTime } from 'luxon';


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
  
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("문서생성:", body)
    const { translatedText, originalFileName, fileType } = body

    if (!translatedText || !originalFileName || !fileType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = user.id;
      console.log("Auth 유저 ID", userId)
      

    // 번역된 파일 생성
    let fileBuffer: Buffer;
    const timestamp = new Date().getTime();
    const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
    const fileExt = originalFileName.substring(originalFileName.lastIndexOf('.'));
    const translatedFileName = `${fileNameWithoutExt}_translated${fileExt}`;
    
    // 파일 형식에 따라 문서 생성
    //아직 UI 디자인 구현까지는 안될 가능성 있음
    switch (fileType.toLowerCase()) {
      case 'pdf':
        fileBuffer = await generatePDF(translatedText);
        break;

      case 'docx':
        fileBuffer = await generateDOCX(translatedText);
        break;

      case 'txt':
        fileBuffer = Buffer.from(translatedText, 'utf-8');
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
    }

    // Supabase Storage에 업로드
    const filePath = `${userId}/${timestamp}/${translatedFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer);

    if (uploadError) {
      throw uploadError;
    }

    // 24시간 유효한 다운로드 URL 생성
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 86400); // 24시간 (초 단위)

    if (urlError || !urlData?.signedUrl) {
      throw urlError || new Error("Failed to create signed URL");
    }

    // 문서 번역 메타데이터 저장
    const expiresAt = DateTime.now().plus({ hours: 24 }).toISO();
    const sourceLanguage = ""; // 클라이언트에서 받아와야 함
    const targetLanguage = ""; // 클라이언트에서 받아와야 함

    const { data: metaData, error: metaError } = await supabase
      .from('document_translations')
      .insert({
        user_id: userId,
        document_name: originalFileName,
        source_language: sourceLanguage || "Unknown",
        target_language: targetLanguage || "Unknown",
        file_url: "", // 원본 파일 URL (필요하면 추가)
        file_size: fileBuffer.length,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        translated_file_url: urlData.signedUrl
      })
      .select()
      .single();

    if (metaError) {
      throw metaError;
    }

    return NextResponse.json({ documentData: metaData });

  } catch (error: any) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: error.message || "Failed to generate document" },
      { status: 500 }
    );
  }
}

// PDF 생성 함수
async function generatePDF(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(12).text(text, {
        align: 'left',
        lineGap: 5
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// DOCX 생성 함수
async function generateDOCX(text: string): Promise<Buffer> {
  const paragraphs = text.split('\n').map(paragraph => 
    new Paragraph({
      children: [new TextRun(paragraph)]
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  return Packer.toBuffer(doc);
} 