import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
      <div className="animate-fade-up">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'glass-card shadow-xl border-none',
              headerTitle: 'font-display text-slate-900',
              headerSubtitle: 'text-slate-500',
              formButtonPrimary: 'btn-primary border-none shadow-md',
              formFieldInput: 'input',
              footerActionLink: 'text-sky-500 hover:text-sky-600',
            },
          }}
        />
      </div>
    </div>
  );
}
