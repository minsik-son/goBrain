import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

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
    const buffer = Buffer.from(arrayBuffer);

    let text = '';
    
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
        // JSZip을 사용하여 XML 구조와 텍스트 추출
        const docxData = await extractDocxStructure(buffer);
        
        console.log("DOCX 데이터 추출 완료:", {
          textNodesCount: docxData.textNodes.length,
          hasStyles: !!docxData.styles,
          hasImages: !!docxData.images
        });
        console.log("extract-text에서 내보내는 docxData: ", docxData.extractedText, docxData)
        return NextResponse.json({ 
            text: docxData.extractedText,   // 텍스트 추출 (호환성 유지)
            docxData: docxData              // XML 구조 데이터
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

/**
 * DOCX 파일을 분석하여 XML 구조와 텍스트를 추출하는 함수
 * @param buffer DOCX 파일 버퍼
 * @returns 텍스트 및 XML 구조 데이터
 */
async function extractDocxStructure(buffer: Buffer) {
  try {
    // JSZip을 사용하여 DOCX 파일 압축 해제
    const zip = new JSZip();
    const docx = await zip.loadAsync(buffer);
    
    // document.xml 파일 추출 (주요 콘텐츠 포함)
    const documentXml = await docx.file('word/document.xml')?.async('text');
    if (!documentXml) {
      throw new Error('document.xml을 찾을 수 없습니다');
    }
    
    // XML 파싱을 위한 옵션 설정
    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      preserveOrder: true
    };
    
    const parser = new XMLParser(parserOptions);
    const documentObj = parser.parse(documentXml);
    
    // 텍스트 노드 추출 (두 가지 방법으로 추출 시도)
    let textNodes = extractTextNodes(documentObj);
    
    // 기존 방식으로 추출한 노드가 없거나 적으면 직접 정규식으로 추출 시도
    if (!textNodes || textNodes.length < 3) {
      console.log("기존 방식으로 텍스트 추출 실패, 정규식 기반 직접 추출 시도");
      textNodes = extractTextNodesDirectly(documentXml);
    }
    
    console.log(`추출된 텍스트 노드 수: ${textNodes.length}`);
    
    // 스타일, 테마, 헤더/푸터 등의 추가 XML 파일 추출
    const styleXml = await docx.file('word/styles.xml')?.async('text') || null;
    const themeXml = await docx.file('word/theme/theme1.xml')?.async('text') || null;
    const settingsXml = await docx.file('word/settings.xml')?.async('text') || null;
    
    // 관계 파일 추출 (이미지 등의 참조를 위해)
    const relationshipsXml = await docx.file('word/_rels/document.xml.rels')?.async('text') || null;
    
    // 폰트 테이블
    const fontTableXml = await docx.file('word/fontTable.xml')?.async('text') || null;
    
    // 모든 파일 정보 수집 (재구성에 필요)
    const allFiles: Record<string, Buffer> = {};
    for (const fileName in docx.files) {
      const file = docx.files[fileName];
      if (!file.dir) {
        try {
          const content = await file.async('nodebuffer');
          allFiles[fileName] = content;
        } catch (err) {
          console.warn(`파일 '${fileName}' 추출 실패:`, err);
        }
      }
    }
    
    // 필요한 경우 이미지 파일 목록 수집
    const imageFiles: Record<string, string> = {};
    const mediaFiles = Object.keys(docx.files).filter(fileName => fileName.startsWith('word/media/'));
    for (const mediaFile of mediaFiles) {
      const fileData = await docx.file(mediaFile)?.async('base64');
      if (fileData) {
        imageFiles[mediaFile] = fileData;
      }
    }
    
    // 원본 DOCX 파일의 전체 파일 구조
    return {
      document: documentXml,
      documentObj: documentObj,
      extractedText: textNodes.join('\n'),
      textNodes: textNodes,
      styles: styleXml,
      theme: themeXml,
      settings: settingsXml,
      relationships: relationshipsXml,
      fontTable: fontTableXml,
      files: allFiles,
      images: Object.keys(imageFiles).length > 0 ? imageFiles : null,
      buffer: buffer  // 원본 버퍼도 포함 (필요한 경우)
    };
  } catch (error: any) {
    console.error('DOCX 구조 추출 오류:', error);
    throw new Error(`DOCX 파일 구조 분석 중 오류: ${error.message}`);
  }
}

/**
 * XML 객체에서 텍스트 노드를 재귀적으로 추출하는 함수
 * @param obj XML 객체 또는 배열
 * @returns 추출된 텍스트 배열
 */
function extractTextNodes(obj: any): string[] {
  if (!obj) return [];
  
  let result: string[] = [];
  
  if (Array.isArray(obj)) {
    // 배열의 각 항목에 대해 재귀 호출
    for (const item of obj) {
      result = result.concat(extractTextNodes(item));
    }
  } else if (typeof obj === 'object') {
    // 'w:t' 요소인 경우 텍스트 추출
    if (obj['w:t']) {
      const textContent = obj['w:t']['#text'];
      if (textContent) {
        result.push(typeof textContent === 'string' ? textContent : textContent.toString());
      } else if (typeof obj['w:t'] === 'string') {
        // w:t가 직접 문자열인 경우
        result.push(obj['w:t']);
      }
    }
    
    // 'w:p' 요소의 경우, 텍스트 간 줄바꿈을 추가하도록 검사
    if (obj['w:p'] && result.length > 0 && result[result.length - 1] !== '\n') {
      result.push('\n');
    }
    
    // 다른 모든 필드에 대해 재귀 처리
    for (const key in obj) {
      if (key !== '#text' && key !== 'w:t') {
        result = result.concat(extractTextNodes(obj[key]));
      }
    }
  }
  
  // 빈 텍스트가 아닌 결과만 필터링하고 중복 줄바꿈 제거
  return result.filter(text => text && text.trim() !== '');
}

/**
 * 대체 방법: XML을 직접 파싱하여 텍스트 추출
 * @param xml XML 문자열
 * @returns 추출된 텍스트 배열
 */
function extractTextNodesDirectly(xml: string): string[] {
  // w:t 태그에서 텍스트 추출
  const textNodeRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  const result: string[] = [];
  let match;
  
  while ((match = textNodeRegex.exec(xml)) !== null) {
    if (match[1]) {
      // HTML 엔티티를 디코딩하고 결과에 추가
      const decodedText = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      
      result.push(decodedText);
    }
  }
  
  return result.filter(text => text.trim() !== '');
} 
