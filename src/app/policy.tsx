import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { ChoiceGrid, Pills, PlacePicker } from '../components/ChoiceGrid';
import { PhotoStrip } from '../components/PhotoStrip';
import { Button, confirmAction, DateStepper, Field, Screen, SectionTitle, styles as ui, toNumber } from '../components/ui';
import { addMonths, todayStr } from '../lib/due';
import { policyTypesFor } from '../lib/insurance';
import { removePhotos } from '../lib/photos';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Policy } from '../lib/types';

const num = (n?: number) => (n != null ? String(n) : '');

/** Adds an insurance policy, or edits one when an id is passed. */
export default function PolicyForm() {
  const t = useTheme();
  const { assetId, id } = useLocalSearchParams<{ assetId?: string; id?: string }>();
  const existing = useStore((s) => s.policies.find((p) => p.id === id));
  const assets = useStore((s) => s.assets);
  const claimCount = useStore((s) => s.claims.filter((c) => c.policyId === id).length);
  const addPolicy = useStore((s) => s.addPolicy);
  const updatePolicy = useStore((s) => s.updatePolicy);
  const removePolicy = useStore((s) => s.removePolicy);

  const startPlace = existing ? existing.assetId : assetId;
  const startKind = assets.find((a) => a.id === startPlace)?.kind;
  const [place, setPlace] = useState<string | undefined>(startPlace);
  const [type, setType] = useState(existing?.type ?? (startKind === 'vehicle' ? 'auto' : startKind === 'home' ? 'home' : ''));
  const [company, setCompany] = useState(existing?.company ?? '');
  const [policyNumber, setPolicyNumber] = useState(existing?.policyNumber ?? '');
  const [agentName, setAgentName] = useState(existing?.agentName ?? '');
  const [agentPhone, setAgentPhone] = useState(existing?.agentPhone ?? '');
  const [agentEmail, setAgentEmail] = useState(existing?.agentEmail ?? '');
  const [claimsPhone, setClaimsPhone] = useState(existing?.claimsPhone ?? '');
  const [coverage, setCoverage] = useState(num(existing?.coverage));
  const [deductible, setDeductible] = useState(num(existing?.deductible));
  const [premium, setPremium] = useState(num(existing?.premium));
  const [every, setEvery] = useState<Policy['premiumEvery']>(existing?.premiumEvery ?? 'year');
  const [hasRenewal, setHasRenewal] = useState(existing ? !!existing.renewsAt : true);
  const [renewsAt, setRenewsAt] = useState(existing?.renewsAt ?? addMonths(todayStr(), 12));
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  const kind = assets.find((a) => a.id === place)?.kind;
  const isAuto = type === 'auto';

  const values = (): Omit<Policy, 'id'> => ({
    assetId: place,
    type: type || 'other',
    company: company.trim(),
    policyNumber: policyNumber.trim() || undefined,
    agentName: agentName.trim() || undefined,
    agentPhone: agentPhone.trim() || undefined,
    agentEmail: agentEmail.trim() || undefined,
    claimsPhone: claimsPhone.trim() || undefined,
    coverage: toNumber(coverage),
    deductible: toNumber(deductible),
    premium: toNumber(premium),
    premiumEvery: every,
    renewsAt: hasRenewal ? renewsAt : undefined,
    note: note.trim() || undefined,
    photos,
  });

  const save = () => {
    if (existing) {
      removePhotos(existing.photos.filter((p) => !photos.includes(p)));
      updatePolicy(existing.id, values());
    } else {
      addPolicy(values());
    }
    router.back();
  };

  const cancel = () => {
    removePhotos(existing ? photos.filter((p) => !existing.photos.includes(p)) : photos);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit policy' : 'Add a policy' }} />
      <PlacePicker assets={assets} value={place} onChange={setPlace} noneLabel="Covers everything" label="What does it cover?" />
      <ChoiceGrid label="Kind of policy" options={policyTypesFor(kind)} value={type} onChange={setType} />
      {type ? (
        <>
          <Field label="Insurance company" value={company} onChangeText={setCompany} placeholder="State Farm, USAA, Progressive" autoCapitalize="words" />
          <Field label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} placeholder="On your ID card or declarations page" autoCapitalize="characters" autoCorrect={false} />
          <Field label="Claims phone number" value={claimsPhone} onChangeText={setClaimsPhone} placeholder="The number to call when something happens" keyboardType="phone-pad" />

          <SectionTitle>Your agent</SectionTitle>
          <Field label="Agent name" value={agentName} onChangeText={setAgentName} placeholder="Name" autoCapitalize="words" />
          <Field label="Agent phone" value={agentPhone} onChangeText={setAgentPhone} placeholder="(505) 555-0100" keyboardType="phone-pad" />
          <Field label="Agent email" value={agentEmail} onChangeText={setAgentEmail} placeholder="agent@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          <SectionTitle>Coverage and cost</SectionTitle>
          <Field
            label={isAuto ? 'Liability limit (optional)' : 'Main coverage amount (optional)'}
            value={coverage}
            onChangeText={setCoverage}
            placeholder={isAuto ? '100000' : '350000'}
            keyboardType="decimal-pad"
            hint={isAuto ? undefined : 'For homeowners this is dwelling coverage, the cost to rebuild.'}
          />
          <Field label="Deductible" value={deductible} onChangeText={setDeductible} placeholder="1000" keyboardType="decimal-pad" />
          <Field label="Premium" value={premium} onChangeText={setPremium} placeholder="0.00" keyboardType="decimal-pad" />
          <Pills
            label="Paid"
            value={every}
            onChange={setEvery}
            options={[
              { value: 'month', label: 'Monthly' },
              { value: 'half', label: 'Every 6 months' },
              { value: 'year', label: 'Yearly' },
            ]}
          />

          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <Text style={[ui.label, { color: t.sub }]}>Remind me before it renews</Text>
            <Switch value={hasRenewal} onValueChange={setHasRenewal} accessibilityLabel="Remind me before it renews" />
          </View>
          {hasRenewal ? <DateStepper future label="Renewal date" value={renewsAt} onChange={setRenewsAt} /> : null}

          <PhotoStrip files label="Declarations page, ID cards or the policy" photos={photos} onChange={setPhotos} />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Has replacement cost on contents" />
          <Button label={existing ? 'Save' : 'Save policy'} disabled={!company.trim()} onPress={save} />
        </>
      ) : (
        <Text style={[ui.sub, { color: t.sub }]}>Pick the kind of policy to get started.</Text>
      )}
      <Button kind="plain" label="Cancel" onPress={cancel} />
      {existing ? (
        <>
          <Button kind="plain" icon="add" label="Log a claim on this policy" onPress={() => router.push({ pathname: '/claim', params: { policyId: existing.id } })} />
          <Button
            kind="danger"
            label="Delete policy"
            onPress={() =>
              confirmAction(
                `Delete ${existing.company}?`,
                claimCount ? 'Its photos and files are deleted too. Claims on it are kept.' : 'Its photos and files are deleted too.',
                'Delete',
                () => {
                  removePhotos(existing.photos);
                  removePolicy(existing.id);
                  router.back();
                }
              )
            }
          />
        </>
      ) : null}
    </Screen>
  );
}
