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
    const { translatedText, originalFileName, fileType, sourceLanguage, targetLanguage, originalHtml } = body

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
      

    // 번역된 파일 생성
    let fileBuffer: Buffer;
    const timestamp = new Date().getTime();
    const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
    const fileExt = originalFileName.substring(originalFileName.lastIndexOf('.'));
    const translatedFileName = `${fileNameWithoutExt}_translated${fileExt}`;
    
    // 파일 형식에 따라 문서 생성
    switch (fileType.toLowerCase()) {
      case 'txt':
        fileBuffer = Buffer.from(translatedText, 'utf-8');
        break;

      case 'docx':
        if (originalHtml) {
          fileBuffer = await generateDocxFromHtmlAndText(originalHtml, translatedText);
        } else {
          fileBuffer = await generateDOCX(translatedText);
        }
        break;

      case 'pdf':
        fileBuffer = await generatePDF(translatedText);
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
    
    
    const languageMap: { [key: string]: string } = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        pt: "Portuguese",
        ru: "Russian",
        ar: "Arabic",
        vi: "Vietnamese",
        th: "Thai",
        hi: "Hindi",
        tr: "Turkish",
        id: "Indonesian",
    };

    const newSourceLanguage = languageMap[sourceLanguage] || "Unknown";
    const newTargetLanguage = languageMap[targetLanguage] || "Unknown";


    const { data: metaData, error: metaError } = await supabase
      .from('document_translations')
      .insert({
        user_id: userId,
        document_name: originalFileName,
        source_language: newSourceLanguage || "Unknown",
        target_language: newTargetLanguage || "Unknown",
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

// HTML 구조를 유지하면서 텍스트만 번역된 DOCX 파일 생성 함수
async function generateDocxFromHtmlAndText(html: string, translatedText: string): Promise<Buffer> {
  try {
    // 원본 HTML에서 텍스트 노드만 번역된 텍스트로 대체하는 로직
    // 간단한 구현을 위해 기존 generateDOCX 함수 사용
    // 실제로는 HTML 파싱 후 텍스트 노드만 교체하는 복잡한 로직 필요
    
    const docx = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: translatedText,
                }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(docx);
  } catch (error) {
    console.error("DOCX 생성 오류:", error);
    throw new Error("DOCX 파일 생성에 실패했습니다");
  }
} 