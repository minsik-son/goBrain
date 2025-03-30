import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface TranslationHistoryItem {
  id: string
  user_id: string
  source_language: string
  target_language: string
  text: string
  translated_text: string
  word_count: number
  created_at: string
}

interface TranslationHistoryState {
  items: TranslationHistoryItem[]
  isLoading: boolean
  error: string | null
  totalPages: number
  currentPage: number
}

const initialState: TranslationHistoryState = {
  items: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
}

// 번역 기록 가져오기
export const fetchTranslationHistory = createAsyncThunk(
  'translationHistory/fetchTranslationHistory',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const supabase = createClientComponentClient()
      const itemsPerPage = 15
      
      // 사용자 확인
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      
      if (!userId) {
        return rejectWithValue('User not authenticated')
      }
      
      // 전체 항목 수 가져오기
      const { count, error: countError } = await supabase
        .from('translation_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
      
      if (countError) {
        throw countError
      }
      
      const total = count || 0
      const totalPages = Math.ceil(total / itemsPerPage)
      
      // 페이지네이션된 기록 가져오기
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      const { data, error } = await supabase
        .from('translation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) {
        throw error
      }
      
      return {
        items: data,
        totalPages,
        currentPage: page,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch translation history')
    }
  }
)

// 번역 기록 삭제
export const deleteTranslationHistoryItem = createAsyncThunk(
  'translationHistory/deleteItem',
  async (id: string, { rejectWithValue, dispatch, getState }) => {
    try {
      const supabase = createClientComponentClient()
      
      // 항목 삭제
      const { error } = await supabase
        .from('translation_history')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw error
      }
      
      // 현재 페이지 다시 로드
      const state: any = getState()
      await dispatch(fetchTranslationHistory(state.translationHistory.currentPage))
      
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete item')
    }
  }
)

const translationHistorySlice = createSlice({
  name: 'translationHistory',
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 번역 기록 로드
      .addCase(fetchTranslationHistory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTranslationHistory.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false
        state.items = action.payload.items
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.currentPage
      })
      .addCase(fetchTranslationHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 번역 기록 삭제
      .addCase(deleteTranslationHistoryItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteTranslationHistoryItem.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(deleteTranslationHistoryItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setCurrentPage } = translationHistorySlice.actions
export default translationHistorySlice.reducer 