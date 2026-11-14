import type { Metadata } from 'next';
import DonatePageClient from './DonatePageClient';
import { loadDonatePageProfile } from '@/lib/donate-page-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadDonatePageProfile();
  return {
    title: `โดเนทให้ ${profile.name}`,
    description: profile.bio || `สนับสนุน ${profile.name} ผ่านหน้าโดเนทสาธารณะ`
  };
}

export default async function DonatePage() {
  const profile = await loadDonatePageProfile();
  return <DonatePageClient initialProfile={profile} />;
}
