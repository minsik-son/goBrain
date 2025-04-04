import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DocumentTranslation {
  id: string;
  user_id: string;
  document_name: string;
  source_language: string;
  target_language: string;
  file_url: string;
  file_size: number;
  created_at: string;
  expires_at: string;
  translated_file_url: string;
}

interface DocumentTranslationState {
  isUploading: boolean;
  uploadStep: 'uploading' | 'extracting' | 'translating' | 'generating' | null;
  currentTranslation: DocumentTranslation | null;
  userPlan: string;
  translationsLeft: number;
  canTranslate: boolean;
  error: string | null;
}

const initialState: DocumentTranslationState = {
  isUploading: false,
  uploadStep: null,
  currentTranslation: null,
  userPlan: 'Basic',
  translationsLeft: 0,
  canTranslate: false,
  error: null,
};

// 사용자 계획 및 제한 가져오기
export const fetchUserPlanAndLimits = createAsyncThunk(
  'documentTranslation/fetchUserPlanAndLimits',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClientComponentClient();
      
      // 사용자 계획 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      const userPlan = userData.plan || 'Basic';
      
      // 계획별 번역 제한 가져오기
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('max_file_size, daily_translations')
        .eq('plan_name', userPlan)
        .single();
      
      if (planError) throw planError;
      
      let canTranslate = false;
      let translationsLeft = 0;
      
      // Explorer 플랜은 문서 번역 불가
      if (userPlan === 'Explorer') {
        canTranslate = false;
      }
      // Starter 플랜은 하루 2번 제한
      else if (userPlan === 'Starter') {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: usageData, error: usageError } = await supabase
          .from('document_translation_usage')
          .select('translation_count')
          .eq('user_id', userId)
          .eq('date', today)
          .single();
        
        if (usageError && usageError.code !== 'PGRST116') {
          throw usageError;
        }
        
        const usedCount = usageData?.translation_count || 0;
        translationsLeft = 2 - usedCount;
        canTranslate = usedCount < 2;
      } else {
        // Creator, Master 플랜은 제한 없음
        canTranslate = true;
      }
      
      return {
        userPlan,
        canTranslate,
        translationsLeft,
        planData
      };
    } catch (error: any) {
      return rejectWithValue(error.message || '사용자 계획 정보를 가져오는 데 실패했습니다.');
    }
  }
);

// 문서 업로드 및 번역
export const uploadAndTranslateDocument = createAsyncThunk(
  'documentTranslation/uploadAndTranslateDocument',
  async ({ 
    file, 
    userId, 
    sourceLanguage, 
    targetLanguage, 
    userPlan 
  }: { 
    file: File, 
    userId: string, 
    sourceLanguage: string, 
    targetLanguage: string,
    userPlan: string
  }, { dispatch, rejectWithValue }) => {
    try {
      const supabase = createClientComponentClient();
      
      // 1. 파일 크기 체크
      const fileSizeInMB = file.size / (1024 * 1024);
      const maxFileSizeByPlan: { [key: string]: number } = {
        'Starter': 1,
        'Creator': 5,
        'Master': 20
      };
      
      const maxFileSize = maxFileSizeByPlan[userPlan] || 1;
      if (fileSizeInMB > maxFileSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 허용 크기: ${maxFileSize}MB`);
      }
      
      // 2. 파일 업로드
      dispatch(setUploadStep('uploading'));
      
      const timestamp = new Date().getTime();
      const filePath = `${userId}/${timestamp}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 3. 서명된 URL 생성
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1시간 유효
      
      if (urlError || !urlData?.signedUrl) {
        throw urlError || new Error('URL 생성에 실패했습니다.');
      }
      // 4. 텍스트 추출
      dispatch(setUploadStep('extracting'));
      const apiUrl = `${window.location.origin}/api/extract-text`;
      console.log('API 요청 URL:', apiUrl);
      
      const fileType = file.name.split('.').pop()?.toLowerCase();
    
      const extractResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: urlData.signedUrl,
          fileType: fileType
        }),
      });
      
      if (!extractResponse.ok) {
        console.error('텍스트 추출 응답 상태:', extractResponse.status);
        console.error('텍스트 추출 응답 텍스트:', await extractResponse.text());
        throw new Error(`텍스트 추출에 실패했습니다. 상태: ${extractResponse.status}`);
      }
      
      // 파일 유형에 따른 처리
      let extractedContent: any = {};
      const fileTypeStr = fileType?.toLowerCase() || '';
      
      if (fileTypeStr === 'txt') {
        // TXT 파일 처리
        const { text } = await extractResponse.json();
        console.log("텍스트는: ", text);
        console.log("파일 사이즈는: ", fileSizeInMB);
        extractedContent = { text };
      } else if (fileTypeStr === 'docx') {
        // DOCX 파일 처리
        const responseData = await extractResponse.json();
        console.log("DOCX 응답 데이터:", Object.keys(responseData));
        
        // 텍스트와 docxData 모두 추출
        const { text, docxData } = responseData;
        console.log("DOCX 처리: 텍스트 및 구조 데이터 추출 완료");
        console.log("텍스트 노드 수:", docxData?.textNodes?.length || 0);
        
        extractedContent = { text, docxData };
      } else if (fileTypeStr === 'pdf') {
        // PDF 파일 처리 (추후 구현)
        const { text } = await extractResponse.json();
        extractedContent = { text };
        console.log("PDF 처리: 아직 구현 중입니다.");
      }
      
      // 5. 번역
      dispatch(setUploadStep('translating'));
      
      // 번역 요청 데이터 구성
      const translationRequestBody: any = {
        inputText: extractedContent.text,
        inputLanguage: sourceLanguage || 'auto',
        outputLanguage: targetLanguage,
        fileType: fileTypeStr,
        fileUrl: urlData.signedUrl
      };
      
      // DOCX의 경우 docxData도 함께 전송
      if (fileTypeStr === 'docx' && extractedContent.docxData) {
        translationRequestBody.docxData = extractedContent.docxData;
      }
      
      console.log("번역 API 요청 데이터:", {
        inputText: extractedContent.text?.substring(0, 100) + "...",
        inputLanguage: sourceLanguage || 'auto',
        outputLanguage: targetLanguage,
        fileType: fileTypeStr
      });
      
      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(translationRequestBody),
      });
      
      if (!translateResponse.ok) {
        const errorData = await translateResponse.json();
        throw new Error(errorData.error || '번역에 실패했습니다.');
      }
      
      const translateResponseData = await translateResponse.json();
      const { translatedText, translatedDocxData } = translateResponseData;
      
      console.log("번역 API 응답:", { 
        hasTranslatedText: !!translatedText, 
        hasTranslatedDocxData: !!translatedDocxData,
        textLength: translatedText?.length || 0
      });
      
      // 6. 문서 생성
      dispatch(setUploadStep('generating'));
      
      const generateRequestBody: any = {
        translatedText,
        originalFileName: file.name,
        fileType: fileTypeStr,
        userId,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage
      };
      
      // DOCX 파일인 경우 번역된 DOCX 데이터도 포함
      if (fileTypeStr === 'docx' && translatedDocxData) {
        generateRequestBody.translatedDocxData = translatedDocxData;
      }
      
      const generateResponse = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateRequestBody)
      });
    
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || '문서 생성에 실패했습니다.');
      }
      
      const { documentData } = await generateResponse.json();
      
      // 7. Starter 플랜 사용량 업데이트
      if (userPlan === 'Starter') {
        console.log("사용량 업데이트 시작")
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingUsage, error: checkError } = await supabase
          .from('document_translation_usage')
          .select('translation_count')
          .eq('user_id', userId)
          .eq('date', today)
          .single();
        
        if (existingUsage) {
          await supabase
            .from('document_translation_usage')
            .update({ translation_count: existingUsage.translation_count + 1 })
            .eq('user_id', userId)
            .eq('date', today);
        } else {
          await supabase
            .from('document_translation_usage')
            .insert({ user_id: userId, date: today, translation_count: 1 });
        }
        
        // 제한 정보 다시 가져오기
        dispatch(fetchUserPlanAndLimits(userId));
      }
      
      return documentData;
    } catch (error: any) {
      return rejectWithValue(error.message || '문서 번역 중 오류가 발생했습니다.');
    }
  }
);

const documentTranslationSlice = createSlice({
  name: 'documentTranslation',
  initialState,
  reducers: {
    setUploadStep: (state, action: PayloadAction<'uploading' | 'extracting' | 'translating' | 'generating'>) => {
      state.uploadStep = action.payload;
    },
    resetTranslation: (state) => {
      state.currentTranslation = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 사용자 플랜 및 제한 가져오기
      .addCase(fetchUserPlanAndLimits.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchUserPlanAndLimits.fulfilled, (state, action) => {
        state.userPlan = action.payload.userPlan;
        state.canTranslate = action.payload.canTranslate;
        state.translationsLeft = action.payload.translationsLeft;
      })
      .addCase(fetchUserPlanAndLimits.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // 문서 업로드 및 번역
      .addCase(uploadAndTranslateDocument.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadAndTranslateDocument.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadStep = null;
        state.currentTranslation = action.payload;
      })
      .addCase(uploadAndTranslateDocument.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadStep = null;
        state.error = action.payload as string;
      });
  }
});

export const { setUploadStep, resetTranslation } = documentTranslationSlice.actions;
export default documentTranslationSlice.reducer; 