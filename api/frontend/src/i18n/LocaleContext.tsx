import React, { createContext, useContext, useMemo } from 'react';
import type { AppLanguage } from '../settings/profileIdentity';
import { DEFAULT_APP_LANGUAGE } from '../settings/profileIdentity';
import { translate, type MessageKey } from './messages';

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: AppLanguage;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_APP_LANGUAGE,
  t: (key, vars) => translate(DEFAULT_APP_LANGUAGE, key, vars),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: AppLanguage;
  children: React.ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const resolved = locale || DEFAULT_APP_LANGUAGE;
    return {
      locale: resolved,
      t: (key, vars) => translate(resolved, key, vars),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function useT(): TranslateFn {
  return useLocale().t;
}
