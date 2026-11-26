import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { Pills, PlacePicker } from '../components/ChoiceGrid';
import { PhotoStrip } from '../components/PhotoStrip';
import { Button, confirmAction, DateStepper, Field, Screen, SectionTitle, toNumber } from '../components/ui';
import { dialable } from '../lib/contacts';
import { todayStr } from '../lib/due';
import { CLAIM_STATUSES, policyType } from '../lib/insurance';
import { removePhotos } from '../lib/photos';
import { useStore } from '../lib/store';
import type { Claim } from '../lib/types';

const num = (n?: number) => (n != null ? String(n) : '');

/** Logs an insurance claim, or edits one when an id is passed. */
export default function ClaimForm() {
  const { assetId, id, policyId } = useLocalSearchParams<{ assetId?: string; id?: string; policyId?: string }>();
  const existing = useStore((s) => s.claims.find((c) => c.id === id));
  const assets = useStore((s) => s.assets);
  const policies = useStore((s) => s.policies);
  const addClaim = useStore((s) => s.addClaim);
  const updateClaim = useStore((s) => s.updateClaim);
  const removeClaim = useStore((s) => s.removeClaim);

  const startPolicy = existing ? existing.policyId : policyId;
  const [policy, setPolicy] = useState<string | undefined>(startPolicy);
  const [place, setPlace] = useState<string | undefined>(
    existing ? existing.assetId : (assetId ?? policies.find((p) => p.id === startPolicy)?.assetId)
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [claimNumber, setClaimNumber] = useState(existing?.claimNumber ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'filed');
  const [adjuster, setAdjuster] = useState(existing?.adjuster ?? '');
  const [adjusterPhone, setAdjusterPhone] = useState(existing?.adjusterPhone ?? '');
  const [claimed, setClaimed] = useState(num(existing?.claimed));
  const [paid, setPaid] = useState(num(existing?.paid));
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  const pickPolicy = (v?: string) => {
    setPolicy(v);
    const p = policies.find((x) => x.id === v);
    if (p?.assetId) setPlace(p.assetId);
  };

  const values = (): Omit<Claim, 'id'> => ({
    policyId: policy,
    assetId: place,
    title: title.trim(),
    date,
    claimNumber: claimNumber.trim() || undefined,
    status,
    adjuster: adjuster.trim() || undefined,
    adjusterPhone: adjusterPhone.trim() || undefined,
    claimed: toNumber(claimed),
    paid: toNumber(paid),
    note: note.trim() || undefined,
    photos,
  });

  const save = () => {
    if (existing) {
      removePhotos(existing.photos.filter((p) => !photos.includes(p)));
      updateClaim(existing.id, values());
    } else {
      addClaim(values());
    }
    router.back();
  };

  const cancel = () => {
    removePhotos(existing ? photos.filter((p) => !existing.photos.includes(p)) : photos);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit claim' : 'Log a claim' }} />
      {policies.length ? (
        <Pills
          label="Which policy?"
          value={policy ?? ''}
          onChange={(v) => pickPolicy(v || undefined)}
          options={[...policies.map((p) => ({ value: p.id, label: `${p.company} ${policyType(p.type).label.toLowerCase()}` })), { value: '', label: 'Not sure yet' }]}
        />
      ) : null}
      <PlacePicker assets={assets} value={place} onChange={setPlace} noneLabel="Something else" label="Where did it happen?" />
      <Field label="What happened?" value={title} onChangeText={setTitle} placeholder="Hail damage to the roof" autoCapitalize="sentences" />
      <DateStepper label="Date it happened" value={date} onChange={setDate} />
      <PhotoStrip files label="Damage photos, estimates and letters" photos={photos} onChange={setPhotos} />
      <Field label="Claim number" value={claimNumber} onChangeText={setClaimNumber} placeholder="From the insurance company" autoCapitalize="characters" autoCorrect={false} />
      <Pills label="Where it stands" value={status} onChange={setStatus} options={CLAIM_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />

      <SectionTitle>Adjuster</SectionTitle>
      <Field label="Adjuster name" value={adjuster} onChangeText={setAdjuster} placeholder="Name" autoCapitalize="words" />
      <Field label="Adjuster phone" value={adjusterPhone} onChangeText={setAdjusterPhone} placeholder="(505) 555-0100" keyboardType="phone-pad" />
      {adjusterPhone.trim() ? (
        <Button small kind="plain" icon="call-outline" label="Call the adjuster" onPress={() => Linking.openURL(`tel:${dialable(adjusterPhone)}`)} />
      ) : null}

      <SectionTitle>Money</SectionTitle>
      <Field label="Amount claimed (optional)" value={claimed} onChangeText={setClaimed} placeholder="0.00" keyboardType="decimal-pad" />
      <Field label="Amount paid (optional)" value={paid} onChangeText={setPaid} placeholder="0.00" keyboardType="decimal-pad" />
      <Field label="Notes" value={note} onChangeText={setNote} placeholder="Who you talked to and what they said" multiline />

      <Button label={existing ? 'Save' : 'Save claim'} disabled={!title.trim()} onPress={save} />
      <Button kind="plain" label="Cancel" onPress={cancel} />
      {existing ? (
        <Button
          kind="danger"
          label="Delete claim"
          onPress={() =>
            confirmAction(`Delete ${existing.title}?`, 'Its photos and files are deleted too.', 'Delete', () => {
              removePhotos(existing.photos);
              removeClaim(existing.id);
              router.back();
            })
          }
        />
      ) : null}
    </Screen>
  );
}
