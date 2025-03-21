import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserState {
  id: string | null
  email: string | null
  userName: string | null
  avatarUrl: string | null
  createdAt: string | null
  preferredLanguage: string
  plan: string
  phone: string
  email_notifications: boolean
  marketing_emails: boolean
  product_updates: boolean
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  id: null,
  email: null,
  userName: null,
  avatarUrl: null,
  createdAt: null,
  preferredLanguage: 'English',
  plan: 'Basic',
  phone: '',
  email_notifications: false,
  marketing_emails: false,
  product_updates: false,
  isLoading: false,
  error: null,
}

// 사용자 정보 가져오기 thunk
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClientComponentClient()
      
      // 세션 확인
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }
      
      if (!sessionData.session) {
        return rejectWithValue('No active session')
      }
      
      // 사용자 인증 정보 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw userError
      }
      
      const userId = userData.user?.id
      
      if (!userId) {
        return rejectWithValue('User not found')
      }
      
      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        throw profileError
      }
      
      return {
        id: userId,
        email: userData.user.email,
        userName: profileData.full_name,
        avatarUrl: profileData.avatar_url,
        createdAt: profileData.created_at,
        preferredLanguage: profileData.preferred_language || 'English',
        plan: profileData.plan || 'Basic',
        phone: profileData.phone || '',
        email_notifications: profileData.email_notifications || false,
        marketing_emails: profileData.marketing_emails || false,
        product_updates: profileData.product_updates || false,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user data')
    }
  }
)

// 사용자 정보 업데이트 thunk
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (
    profileData: {
      fullName?: string
      email?: string
      preferredLanguage?: string
      phone?: string
      email_notifications?: boolean
      marketing_emails?: boolean
      product_updates?: boolean
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const supabase = createClientComponentClient()
      const state: any = getState()
      const userId = state.user.id
      
      if (!userId) {
        return rejectWithValue('User not authenticated')
      }
      
      // 이메일 변경이 있을 경우
      if (profileData.email && profileData.email !== state.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        })
        
        if (emailError) {
          throw emailError
        }
      }
      
      // 프로필 정보 업데이트
      const updateData: any = {}
      
      if (profileData.fullName !== undefined) updateData.full_name = profileData.fullName
      if (profileData.preferredLanguage !== undefined) updateData.preferred_language = profileData.preferredLanguage
      if (profileData.phone !== undefined) updateData.phone = profileData.phone
      if (profileData.email_notifications !== undefined) updateData.email_notifications = profileData.email_notifications
      if (profileData.marketing_emails !== undefined) updateData.marketing_emails = profileData.marketing_emails
      if (profileData.product_updates !== undefined) updateData.product_updates = profileData.product_updates
      
      updateData.updated_at = new Date().toISOString()
      
      const { error: profileError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
      
      if (profileError) {
        throw profileError
      }
      
      return {
        ...state.user,
        userName: profileData.fullName || state.user.userName,
        email: profileData.email || state.user.email,
        preferredLanguage: profileData.preferredLanguage || state.user.preferredLanguage,
        phone: profileData.phone || state.user.phone,
        email_notifications: profileData.email_notifications !== undefined ? profileData.email_notifications : state.user.email_notifications,
        marketing_emails: profileData.marketing_emails !== undefined ? profileData.marketing_emails : state.user.marketing_emails,
        product_updates: profileData.product_updates !== undefined ? profileData.product_updates : state.user.product_updates,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUser: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // 사용자 정보 로드
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserData.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false
        state.id = action.payload.id
        state.email = action.payload.email
        state.userName = action.payload.userName
        state.avatarUrl = action.payload.avatarUrl
        state.createdAt = action.payload.createdAt
        state.preferredLanguage = action.payload.preferredLanguage
        state.plan = action.payload.plan
        state.phone = action.payload.phone
        state.email_notifications = action.payload.email_notifications
        state.marketing_emails = action.payload.marketing_emails
        state.product_updates = action.payload.product_updates
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // 사용자 정보 업데이트
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false
        state.userName = action.payload.userName
        state.email = action.payload.email
        state.preferredLanguage = action.payload.preferredLanguage
        state.phone = action.payload.phone
        state.email_notifications = action.payload.email_notifications
        state.marketing_emails = action.payload.marketing_emails
        state.product_updates = action.payload.product_updates
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { resetUser } = userSlice.actions
export default userSlice.reducer 