import { redirect } from 'next/navigation';

export default function Home() {
  // если у тебя дефолтная локаль en — редиректим туда
  redirect('/en/chat');
}