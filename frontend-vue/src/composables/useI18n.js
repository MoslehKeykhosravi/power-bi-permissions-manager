import { ref, computed } from 'vue'
import translations from '../i18n/translations'

const currentLocale = ref(localStorage.getItem('locale') || 'en')

export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (value) => {
      currentLocale.value = value
      localStorage.setItem('locale', value)
      // Update document direction
      document.documentElement.dir = value === 'fa' ? 'rtl' : 'ltr'
      document.documentElement.lang = value
    }
  })

  const isRTL = computed(() => currentLocale.value === 'fa')

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[currentLocale.value]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value === 'string') {
      // Replace parameters like {count}, {error}, etc.
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match
      })
    }
    
    return key
  }

  const switchLocale = () => {
    locale.value = locale.value === 'en' ? 'fa' : 'en'
  }

  return {
    locale,
    isRTL,
    t,
    switchLocale
  }
}

