import {getRequestConfig} from 'next-intl/server';
import { getMergedMessages } from '@/lib/actions/wording';
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  if (!locale || !['en', 'id'].includes(locale)) {
    locale = 'id';
  }
 
  // Load messages merged with database overrides
  let messages;
  try {
    messages = await getMergedMessages(locale);
  } catch {
    // Fallback to file-based messages if DB is unreachable
    messages = (await import(`../../messages/${locale}.json`)).default;
  }

  return {
    locale,
    messages
  };
});
