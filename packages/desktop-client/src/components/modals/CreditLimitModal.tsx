import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useUpdateAccountMutation } from '#accounts';
import {
  Modal,
  ModalCloseButton,
  ModalHeader,
  ModalTitle,
} from '#components/common/Modal';
import { AmountInput } from '#components/util/AmountInput';
import { useAccount } from '#hooks/useAccount';
import type { Modal as ModalType } from '#modals/modalsSlice';

type CreditLimitModalProps = Extract<
  ModalType,
  { name: 'credit-limit' }
>['options'];

export function CreditLimitModal({ accountId }: CreditLimitModalProps) {
  const { t } = useTranslation();
  const account = useAccount(accountId);
  const updateAccount = useUpdateAccountMutation();
  const [limit, setLimit] = useState<number>(account?.balance_limit ?? 0);

  const save = (balanceLimit: number | null) => {
    updateAccount.mutate({
      account: { id: accountId, balance_limit: balanceLimit },
    });
  };

  return (
    <Modal name="credit-limit">
      {({ state }) => (
        <>
          <ModalHeader
            title={<ModalTitle title={t('Credit limit')} shrinkOnOverflow />}
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          <View style={{ gap: 10, minWidth: 300 }}>
            <Text style={{ color: theme.pageTextSubdued }}>
              <Trans>
                Available credit is shown in the account header when a limit is
                set.
              </Trans>
            </Text>
            <InitialFocus>
              <AmountInput
                value={limit}
                zeroSign="+"
                sign="+"
                onUpdate={setLimit}
                onEnter={(_, amount) => {
                  save(Math.abs(amount ?? limit) || null);
                  state.close();
                }}
              />
            </InitialFocus>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              {account?.balance_limit != null && (
                <Button
                  onPress={() => {
                    save(null);
                    state.close();
                  }}
                >
                  <Trans>Remove limit</Trans>
                </Button>
              )}
              <Button
                variant="primary"
                onPress={() => {
                  save(Math.abs(limit) || null);
                  state.close();
                }}
              >
                <Trans>Save</Trans>
              </Button>
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}
