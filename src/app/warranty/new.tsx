import { router } from 'expo-router';

import { Screen } from '../../components/ui';
import { WarrantyForm } from '../../components/WarrantyForm';
import { ensurePermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';

export default function NewWarranty() {
  const addWarranty = useStore((s) => s.addWarranty);
  const remindersOn = useStore((s) => s.settings.remindersOn);
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <Screen>
      <WarrantyForm
        submitLabel="Save warranty"
        onSubmit={async (v) => {
          const id = addWarranty(v);
          if (remindersOn) {
            const ok = await ensurePermission();
            if (!ok) updateSettings({ remindersOn: false });
          }
          router.replace({ pathname: '/warranty/[id]', params: { id } });
        }}
      />
    </Screen>
  );
}
