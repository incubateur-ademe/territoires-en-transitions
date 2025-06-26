import PageContainer from '@/ui/components/layout/page-container';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PageContainer>{children}</PageContainer>;
}
