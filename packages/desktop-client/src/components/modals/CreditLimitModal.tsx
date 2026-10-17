import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { DEFAULT_DUE_OFFSET_DAYS, isDayOfMonth } from '#accounts/creditCard';
import {
  Modal,
  ModalCloseButton,
  ModalHeader,
  ModalTitle,
} from '#components/common/Modal';
import { FormField, FormLabel } from '#components/forms';
import { AmountInput } from '#components/util/AmountInput';
import { useCreditCardConfig } from '#hooks/useCreditCardConfig';
import type { Modal as ModalType } from '#modals/modalsSlice';

type CreditLimitModalProps = Extract<
  ModalType,
  { name: 'credit-limit' }
>['options'];

const toDay = (text: string) => (text.trim() === '' ? null : Number(text));

export function CreditLimitModal({ accountId }: CreditLimitModalProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useCreditCardConfig(accountId);
  const [statementDay, setStatementDay] = useState(
    config ? String(config.statementDay) : '',
  );
  const [dueDay, setDueDay] = useState(
    config?.dueDay ? String(config.dueDay) : '',
  );
  const [limit, setLimit] = useState<number>(config?.limit ?? 0);

  const parsedStatementDay = toDay(statementDay);
  const parsedDueDay = toDay(dueDay);
  const isValid =
    isDayOfMonth(parsedStatementDay) &&
    (parsedDueDay === null || isDayOfMonth(parsedDueDay));

  const save = (amount: number) => {
    if (!isValid) {
      return;
    }
    setConfig({
      statementDay: parsedStatementDay,
      dueOffsetDays: config?.dueOffsetDays ?? DEFAULT_DUE_OFFSET_DAYS,
      ...(parsedDueDay !== null && { dueDay: parsedDueDay }),
      ...(Math.abs(amount) > 0 && { limit: Math.abs(amount) }),
    });
  };

  return (
    <Modal name="credit-limit">
      {({ state }) => (
        <>
          <ModalHeader
            title={
              <ModalTitle title={t('Credit card settings')} shrinkOnOverflow />
            }
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          <View style={{ gap: 10, minWidth: 300 }}>
            <Text style={{ color: theme.pageTextSubdued }}>
              <Trans>
                Available credit is shown in the account header when a limit is
                set. These settings are shared with the Actua and Actuali mobile
                apps.
              </Trans>
            </Text>
            <FormField>
              <FormLabel
                title={t('Statement closing day (1–31)')}
                htmlFor="statement-day-field"
              />
              <InitialFocus>
                <Input
                  id="statement-day-field"
                  inputMode="numeric"
                  value={statementDay}
                  onChangeValue={setStatementDay}
                />
              </InitialFocus>
            </FormField>
            <FormField>
              <FormLabel
                title={t('Payment due day (optional)')}
                htmlFor="due-day-field"
              />
              <Input
                id="due-day-field"
                inputMode="numeric"
                value={dueDay}
                onChangeValue={setDueDay}
              />
            </FormField>
            <FormField>
              <FormLabel title={t('Credit limit')} htmlFor="limit-field" />
              <AmountInput
                id="limit-field"
                value={limit}
                zeroSign="+"
                sign="+"
                onUpdate={setLimit}
                onEnter={(_, amount) => {
                  if (isValid) {
                    save(amount ?? limit);
                    state.close();
                  }
                }}
              />
            </FormField>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              {config && (
                <Button
                  onPress={() => {
                    setConfig(null);
                    state.close();
                  }}
                >
                  <Trans>Remove</Trans>
                </Button>
              )}
              <Button
                variant="primary"
                isDisabled={!isValid}
                onPress={() => {
                  save(limit);
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
