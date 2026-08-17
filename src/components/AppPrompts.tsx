import { useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import usePWAInstall from '../hooks/usePWAInstall';
import { useI18n } from '../i18n/context';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { IconAddSquare, IconInstall, IconRefresh, IconShare } from './ui/Icons';

interface PromptCardProps {
  icon: ReactNode;
  title: string;
  blurb: string;
  /** Label for the button that does the thing. */
  actionLabel: string;
  onAction: () => void;
  dismissLabel: string;
  onDismiss: () => void;
}

function PromptCard({
  icon,
  title,
  blurb,
  actionLabel,
  onAction,
  dismissLabel,
  onDismiss,
}: PromptCardProps) {
  return (
    <div className="card slide-up pointer-events-auto flex items-start gap-3 p-4 shadow-pop">
      <span className="puck h-9 w-9">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{blurb}</p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            {dismissLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IosSteps({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();

  const steps: { icon: ReactNode; text: string }[] = [
    { icon: <IconShare className="h-5 w-5" />, text: t.install.iosStep1 },
    { icon: <IconAddSquare className="h-5 w-5" />, text: t.install.iosStep2 },
    { icon: <IconInstall className="h-5 w-5" />, text: t.install.iosStep3 },
  ];

  return (
    <Modal open={open} title={t.install.iosTitle} onClose={onClose} widthClass="max-w-md">
      <p className="text-sm leading-relaxed text-ink-muted">{t.install.iosIntro}</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="puck h-8 w-8">{step.icon}</span>
            <span className="pt-1.5 text-sm leading-relaxed">{step.text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-info">
        {t.install.iosSafariNote}
      </p>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose} data-autofocus>
          {t.install.done}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * The app's two transient, self-dismissing notices. They share one fixed
 * container so a waiting update and an install offer stack instead of landing on
 * top of each other in the same corner.
 */
export default function AppPrompts() {
  const { t } = useI18n();
  const { method, visible, install, dismiss } = usePWAInstall();
  const [howToOpen, setHowToOpen] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // The banner hides behind its own modal, but `howToOpen` still has to keep the
  // component mounted or the modal would unmount the moment it opened.
  const showInstall = visible && !howToOpen;

  if (!needRefresh && !showInstall && !howToOpen) return null;

  return (
    <>
      {/*
        `pointer-events-none` on the container so the empty space beside a narrow
        banner does not swallow clicks on the page underneath; each card turns
        pointer events back on for itself.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-end">
        {needRefresh && (
          <div className="w-full max-w-sm">
            <PromptCard
              icon={<IconRefresh className="h-5 w-5" />}
              title={t.update.title}
              blurb={t.update.blurb}
              actionLabel={t.update.action}
              onAction={() => void updateServiceWorker(true)}
              dismissLabel={t.update.dismiss}
              onDismiss={() => setNeedRefresh(false)}
            />
          </div>
        )}

        {showInstall && (
          <div className="w-full max-w-sm">
            <PromptCard
              icon={<IconInstall className="h-5 w-5" />}
              title={t.install.title}
              blurb={t.install.blurb}
              // iOS has no install API, so the only honest action there is to
              // show where Apple hid the button.
              actionLabel={method === 'ios' ? t.install.iosAction : t.install.action}
              onAction={() => (method === 'ios' ? setHowToOpen(true) : void install())}
              dismissLabel={t.install.dismiss}
              onDismiss={dismiss}
            />
          </div>
        )}
      </div>

      <IosSteps
        open={howToOpen}
        onClose={() => {
          setHowToOpen(false);
          // They have seen the steps; leaving the banner up would just nag.
          dismiss();
        }}
      />
    </>
  );
}
