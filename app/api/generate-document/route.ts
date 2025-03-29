import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { DateTime } from 'luxon';
import JSZip from 'jszip';

// 최신 Next.js 구성 방식으로 업데이트
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 처리 시간이 길어질 수 있으므로 60초로 설정

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
    const { translatedText, originalFileName, fileType, sourceLanguage, targetLanguage, translatedDocxData } = body

    console.log("문서 생성 요청 데이터:", { 
      hasTranslatedText: !!translatedText, 
      originalFileName, 
      fileType, 
      hasTranslatedDocxData: !!translatedDocxData 
    });

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
        // JSZip 기반 서식 유지 방식으로 DOCX 생성
        if (translatedDocxData && translatedDocxData.document) {
          fileBuffer = await generateDocxWithPreservedFormatting(translatedDocxData);
        } else {
          // fallback으로 기본 DOCX 생성 (서식 없음)
          fileBuffer = await generateSimpleDOCX(translatedText);
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

// 기본 DOCX 생성 함수 (서식 없음, fallback용)
async function generateSimpleDOCX(text: string): Promise<Buffer> {
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

/**
 * JSZip으로 추출한 XML 구조에서 텍스트 노드만 교체하여 원본 서식을 유지한 DOCX 파일 생성
 * @param docxData JSZip으로 추출한 문서 데이터 (원본 XML과 번역된 텍스트 노드 포함)
 * @returns DOCX 파일 버퍼
 */
async function generateDocxWithPreservedFormatting(docxData: any): Promise<Buffer> {
  try {
    console.log("서식 유지 DOCX 생성 시작...");
    console.log("docxData 검증:", {
      hasDocument: !!docxData.document,
      hasTranslatedNodes: !!docxData.translatedTextNodes,
      translatedNodesCount: docxData.translatedTextNodes?.length || 0,
      hasFiles: !!docxData.files,
      hasBuffer: !!docxData.buffer
    });
    
    if (!docxData.document) {
      console.error("document 필드가 누락됨");
      throw new Error("필요한 문서 데이터(document)가 누락되었습니다");
    }
    
    if (!docxData.translatedTextNodes || docxData.translatedTextNodes.length === 0) {
      console.error("translatedTextNodes 필드가 누락되거나 비어 있음");
      // 번역된 텍스트가 없는 경우, 단일 텍스트가 있는지 확인
      if (docxData.translatedText) {
        console.log("translatedText를 단일 노드로 사용");
        docxData.translatedTextNodes = [docxData.translatedText];
      } else {
        throw new Error("번역된 텍스트 노드가 없습니다");
      }
    }
    
    // 새 ZIP 파일 생성
    const zip = new JSZip();
    let filesAdded = false;
    
    // 원본 docx 파일 구조를 기반으로 새 DOCX 생성
    
    // 1. 모든 파일을 새 ZIP에 복사 (원본 구조 유지)
    if (docxData.files && Object.keys(docxData.files).length > 0) {
      console.log("docxData.files에서 파일 추가");
      filesAdded = true;
      for (const fileName in docxData.files) {
        // document.xml은 나중에 수정된 버전으로 추가할 것이므로 건너뜀
        if (fileName !== 'word/document.xml') {
          zip.file(fileName, docxData.files[fileName]);
        }
      }
    }
    
    // 파일 목록이 없거나 추가된 파일이 없으면 원본 버퍼에서 파일 추출 시도
    if (!filesAdded && docxData.buffer) {
      console.log("원본 버퍼에서 파일 추출 시도");
      try {
        const originalZip = await JSZip.loadAsync(docxData.buffer);
        for (const fileName in originalZip.files) {
          if (fileName !== 'word/document.xml' && !originalZip.files[fileName].dir) {
            const content = await originalZip.files[fileName].async('nodebuffer');
            zip.file(fileName, content);
            filesAdded = true;
          }
        }
      } catch (zipError) {
        console.error("원본 버퍼에서 파일 추출 실패:", zipError);
      }
    }
    
    // 필수 파일이 없을 경우 간단한 DOCX 파일 생성
    if (!filesAdded) {
      console.warn("파일 구조 추출 실패, 기본 DOCX 구조 생성");
      // 최소 필수 파일 추가
      zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    }
    
    // 2. document.xml 파일에서 텍스트 노드 교체
    let documentXml = docxData.document;
    
    const originalTextNodes = docxData.textNodes || [];
    const translatedTextNodes = docxData.translatedTextNodes || [];
    
    console.log(`원본 텍스트 노드: ${originalTextNodes.length}개`);
    console.log(`번역된 텍스트 노드: ${translatedTextNodes.length}개`);
    
    // 텍스트 노드 교체 전략 선택
    if (originalTextNodes.length === 0 || translatedTextNodes.length === 0) {
      console.log("텍스트 노드가 없거나 비어 있음, 직접 텍스트 교체 시도");
      
      // 텍스트 노드가 없는 경우, 전체 텍스트 교체 시도
      if (docxData.extractedText && docxData.translatedText) {
        documentXml = documentXml.replace(docxData.extractedText, docxData.translatedText);
      } else if (translatedTextNodes.length > 0) {
        // 추출된 텍스트는 없지만 번역된 노드가 있는 경우
        // w:t 태그 내용을 번역된 텍스트로 교체 시도
        const textNodeRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
        let newXml = documentXml;
        let i = 0;
        let match;
        
        // 각 w:t 태그 내용을 번역된 텍스트로 교체
        while ((match = textNodeRegex.exec(documentXml)) !== null && i < translatedTextNodes.length) {
          if (match[1].trim() !== '') {
            newXml = newXml.replace(match[0], match[0].replace(match[1], translatedTextNodes[i++]));
          }
        }
        
        documentXml = newXml;
      }
    } else if (originalTextNodes.length !== translatedTextNodes.length) {
      console.warn("원본 텍스트 노드와 번역된 텍스트 노드의 수가 일치하지 않습니다");
      // 일치하지 않을 경우 더 적은 수를 기준으로 처리
      const minLength = Math.min(originalTextNodes.length, translatedTextNodes.length);
      for (let i = 0; i < minLength; i++) {
        try {
          // 특수 문자 처리 및 정규식 이스케이프
          const escapedOriginal = String(originalTextNodes[i])
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s+');
            
          try {
            const regex = new RegExp(`(>\\s*)${escapedOriginal}(\\s*<)`, 'g');
            documentXml = documentXml.replace(regex, `$1${translatedTextNodes[i].trim()}$2`);
          } catch (regexError) {
            console.error(`정규식 오류 (노드 #${i}):`, regexError);
            // 단순 문자열 교체로 fallback
            documentXml = documentXml.replace(originalTextNodes[i], translatedTextNodes[i]);
          }
        } catch (error) {
          console.error(`노드 #${i} 교체 중 오류:`, error);
        }
      }
    } else {
      // 텍스트 노드 수가 일치하는 경우
      for (let i = 0; i < originalTextNodes.length; i++) {
        if (!originalTextNodes[i] || !translatedTextNodes[i]) continue;
        
        try {
          // 특수 문자 처리 및 정규식 이스케이프
          const escapedOriginal = String(originalTextNodes[i])
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s+');
            
          try {
            // 태그 내 텍스트를 정확히 찾기 위한 정규식 패턴
            const regex = new RegExp(`(>\\s*)${escapedOriginal}(\\s*<)`, 'g');
            const newXml = documentXml.replace(regex, `$1${translatedTextNodes[i].trim()}$2`);
            
            // 교체가 발생했는지 확인
            if (newXml !== documentXml) {
              documentXml = newXml;
            } else {
              // 정규식 매치가 실패한 경우 단순 문자열 교체 시도
              documentXml = documentXml.replace(originalTextNodes[i], translatedTextNodes[i]);
            }
          } catch (regexError) {
            console.error(`정규식 오류 (노드 #${i}):`, regexError);
            // 단순 문자열 교체로 fallback
            documentXml = documentXml.replace(originalTextNodes[i], translatedTextNodes[i]);
          }
        } catch (error) {
          console.error(`노드 #${i} 교체 중 오류:`, error);
        }
      }
    }
    
    // 3. 수정된 document.xml 저장
    console.log("document.xml 저장");
    zip.file('word/document.xml', documentXml);
    
    // 4. 이미지 파일 추가 (원본 이미지 유지)
    if (docxData.images && Object.keys(docxData.images).length > 0) {
      console.log("이미지 파일 추가");
      for (const imagePath in docxData.images) {
        const imageData = docxData.images[imagePath];
        zip.file(imagePath, imageData, { base64: true });
      }
    }
    
    // 5. DOCX 파일 생성
    console.log("최종 DOCX 파일 생성");
    return await zip.generateAsync({ type: 'nodebuffer' });
    
  } catch (error: any) {
    console.error("서식 유지 DOCX 생성 오류:", error);
    // 오류 발생 시 단순 DOCX로 fallback
    console.log("기본 DOCX 파일로 fallback");
    const plainText = docxData?.translatedText || docxData?.translatedTextNodes?.join('\n') || '';
    return generateSimpleDOCX(plainText);
  }
} 