import { router, useLocalSearchParams } from 'expo-router';

import { TaskForm } from '../../components/TaskForm';
import { Empty, Screen } from '../../components/ui';
import { useStore } from '../../lib/store';

export default function NewTask() {
  const { assetId, applianceId } = useLocalSearchParams<{ assetId: string; applianceId?: string }>();
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const addTask = useStore((s) => s.addTask);

  if (!asset) {
    return (
      <Screen>
        <Empty icon="help-circle-outline" title="Not found" body="Add a home or vehicle first." />
      </Screen>
    );
  }

  return (
    <Screen>
      <TaskForm
        kind={asset.kind}
        submitLabel="Add task"
        onSubmit={(v) => {
          addTask({ ...v, assetId: asset.id, applianceId: applianceId || undefined });
          router.back();
        }}
      />
    </Screen>
  );
}
