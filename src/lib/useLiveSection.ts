import { useState } from 'react';
import { useLiveCMS } from './LiveCMSContext';

export interface FieldConfig {
  key: string;
  default: string;
}

export function useLiveSection<T extends Record<string, FieldConfig>>(fields: T) {
  const { getContent, saveSectionContent } = useLiveCMS();
  const [draft, setDraft] = useState<Partial<Record<keyof T, string>>>({});

  // Derivar los datos directamente durante el renderizado (cero useEffect, cero cascading renders)
  const data = {} as Record<keyof T, string>;
  for (const fieldName in fields) {
    const config = fields[fieldName];
    data[fieldName] = draft[fieldName] ?? getContent(config.key, config.default);
  }

  const update = (field: keyof T, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    const payload: Record<string, string> = {};
    for (const fieldName in fields) {
      payload[fields[fieldName].key] = data[fieldName];
    }
    await saveSectionContent(payload);
    setDraft({});
  };

  const cancel = () => {
    setDraft({});
  };

  return {
    data,
    update,
    save,
    cancel,
    setDraft,
  };
}
