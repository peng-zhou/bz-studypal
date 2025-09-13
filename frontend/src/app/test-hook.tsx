
// Test file to demonstrate hook effectiveness
'use client';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  // This should trigger the pre-commit hook error
  router.push('/test'); // Missing const router = useRouter();
  return <div>Test</div>;
}

