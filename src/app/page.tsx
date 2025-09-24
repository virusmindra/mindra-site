import {redirect} from 'next/navigation';

export default function RootRedirect() {
  redirect('/ru'); // поменяй на свою defaultLocale при желании
}
