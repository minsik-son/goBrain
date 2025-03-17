// 언어 코드와 이름 매핑
export const langCodeToName = {
  'en': 'English',
  'ko': 'Korean',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ru': 'Russian',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'tr': 'Turkish',
  'id': 'Indonesian'
};

// 언어 이름에서 코드 찾기
export const getLanguageCodeFromName = (name: string): string | null => {
  const entry = Object.entries(langCodeToName).find(([_, langName]) => langName === name);
  return entry ? entry[0] : null;
};

// 언어 코드에서 이름 찾기
export const getLanguageNameFromCode = (code: string): string | null => {
  return langCodeToName[code] || null;
}; 