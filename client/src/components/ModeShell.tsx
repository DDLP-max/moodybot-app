type ModeShellProps = {
  children: React.ReactNode;
  max?: '3xl' | '4xl' | '5xl';
};

const maxMap = { '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl' };

export default function ModeShell({ children, max = '4xl' }: ModeShellProps) {
  return (
    <div className={`mx-auto ${maxMap[max]} px-4 md:px-6 lg:px-8 py-6`}>
      {children}
    </div>
  );
}
