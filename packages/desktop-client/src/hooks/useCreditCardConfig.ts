import { useCallback, useMemo } from 'react';

import type { AccountEntity } from '@actual-app/core/types/models';

import {
  creditCardPrefKey,
  parseCreditCardConfig,
  serializeCreditCardConfig,
} from '#accounts/creditCard';
import type { CreditCardConfig } from '#accounts/creditCard';

import { useSyncedPref } from './useSyncedPref';

export function useCreditCardConfig(
  accountId: AccountEntity['id'],
): [CreditCardConfig | null, (config: CreditCardConfig | null) => void] {
  const [value, setValue] = useSyncedPref(creditCardPrefKey(accountId));
  const config = useMemo(() => parseCreditCardConfig(value), [value]);
  const setConfig = useCallback(
    (next: CreditCardConfig | null) =>
      setValue(next ? serializeCreditCardConfig(next, value) : undefined),
    [setValue, value],
  );
  return [config, setConfig];
}
