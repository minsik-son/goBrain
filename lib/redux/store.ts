import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import translationHistoryReducer from './slices/translationHistorySlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    translationHistory: translationHistoryReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 