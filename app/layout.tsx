import type { Metadata } from 'next';
export const metadata: Metadata = {title:'Still · A little room to focus',description:'Your private, synced workspace for tasks, projects, notes, and focused time.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
