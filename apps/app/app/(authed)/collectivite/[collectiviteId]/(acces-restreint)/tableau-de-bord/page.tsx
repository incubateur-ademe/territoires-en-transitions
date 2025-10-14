import { redirect } from 'next/navigation';

export default function RedirectToTdbPage() {
  redirect('tableau-de-bord/synthetique');
}
