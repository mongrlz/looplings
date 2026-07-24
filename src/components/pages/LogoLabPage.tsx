import type { ComponentType, CSSProperties } from 'react';
import Anthropic from '@lobehub/icons/es/Anthropic/components/Mono';
import Claude from '@lobehub/icons/es/Claude/components/Mono';
import Cohere from '@lobehub/icons/es/Cohere/components/Mono';
import DeepSeek from '@lobehub/icons/es/DeepSeek/components/Mono';
import Gemini from '@lobehub/icons/es/Gemini/components/Mono';
import GithubCopilot from '@lobehub/icons/es/GithubCopilot/components/Mono';
import Google from '@lobehub/icons/es/Google/components/Mono';
import Grok from '@lobehub/icons/es/Grok/components/Mono';
import LobeHub from '@lobehub/icons/es/LobeHub/components/Mono';
import Meta from '@lobehub/icons/es/Meta/components/Mono';
import Mistral from '@lobehub/icons/es/Mistral/components/Mono';
import OpenAI from '@lobehub/icons/es/OpenAI/components/Mono';
import OpenRouter from '@lobehub/icons/es/OpenRouter/components/Mono';
import Perplexity from '@lobehub/icons/es/Perplexity/components/Mono';
import XAI from '@lobehub/icons/es/XAI/components/Mono';

type LogoIcon = ComponentType<any> & {
  Avatar?: ComponentType<any>;
  Color?: ComponentType<any>;
  Combine?: ComponentType<any>;
  Text?: ComponentType<any>;
  colorPrimary?: string;
  title?: string;
};

type LogoEntry = {
  id: string;
  label: string;
  role: 'provider' | 'model' | 'application';
  screenUse: string;
  Icon: LogoIcon;
  bg?: string;
};

const logoEntries: LogoEntry[] = [
  { id: 'openai', label: 'OpenAI', role: 'provider', screenUse: 'Prime thinking buddy', Icon: OpenAI, bg: '#101410' },
  { id: 'anthropic', label: 'Anthropic', role: 'provider', screenUse: 'Claude provider badge', Icon: Anthropic, bg: '#f1f0e8' },
  { id: 'claude', label: 'Claude', role: 'model', screenUse: 'alternate model readout', Icon: Claude },
  { id: 'google', label: 'Google', role: 'provider', screenUse: 'Gemini provider badge', Icon: Google, bg: 'linear-gradient(135deg, #4285f4, #34a853 42%, #fbbc05 68%, #ea4335)' },
  { id: 'gemini', label: 'Gemini', role: 'model', screenUse: 'alternate model readout', Icon: Gemini, bg: 'linear-gradient(135deg, #8bb8ff, #c18cff)' },
  { id: 'deepseek', label: 'DeepSeek', role: 'model', screenUse: 'cheap thinking state', Icon: DeepSeek },
  { id: 'mistral', label: 'Mistral', role: 'model', screenUse: 'fast scout state', Icon: Mistral },
  { id: 'meta', label: 'Meta', role: 'provider', screenUse: 'open model provider', Icon: Meta, bg: 'linear-gradient(45deg, #007ff8, #0668e1, #007ff8)' },
  { id: 'grok', label: 'Grok', role: 'model', screenUse: 'xAI model state', Icon: Grok, bg: '#111111' },
  { id: 'xai', label: 'xAI', role: 'provider', screenUse: 'Grok provider badge', Icon: XAI, bg: '#111111' },
  { id: 'perplexity', label: 'Perplexity', role: 'provider', screenUse: 'web research state', Icon: Perplexity },
  { id: 'cohere', label: 'Cohere', role: 'provider', screenUse: 'embedding/rerank state', Icon: Cohere },
  { id: 'openrouter', label: 'OpenRouter', role: 'provider', screenUse: 'model routing bridge', Icon: OpenRouter },
  { id: 'github-copilot', label: 'GitHub Copilot', role: 'application', screenUse: 'developer assist state', Icon: GithubCopilot, bg: '#111111' },
  { id: 'lobehub', label: 'LobeHub', role: 'provider', screenUse: 'icon source reference', Icon: LobeHub, bg: '#111111' },
];

function contrastColor(bg: string) {
  return bg === '#f1f0e8' || bg === '#fff' ? '#11190f' : '#fff7d8';
}

function LogoCard({ entry }: { entry: LogoEntry }) {
  const Icon = entry.Icon;
  const naturalColor = Icon.colorPrimary ?? '#4f8c4e';
  const naturalBg = entry.bg ?? naturalColor;
  const NaturalIcon = Icon.Color ?? Icon;
  const TextLogo = Icon.Text ?? Icon.Combine;

  return (
    <article
      className="logo-lab-card"
      style={
        {
          '--logo-color': naturalColor,
          '--logo-bg': naturalBg,
          '--logo-fg': contrastColor(naturalBg),
        } as CSSProperties
      }
    >
      <div className="logo-lab-natural">
        <NaturalIcon size={52} />
      </div>
      <div className="logo-lab-cream">
        <Icon size={34} />
        <span>{entry.id}</span>
      </div>
      <div className="logo-lab-copy">
        <span>{entry.role}</span>
        <strong>{entry.label}</strong>
        <p>{entry.screenUse}</p>
        <code>{naturalColor}</code>
      </div>
      <div className="logo-lab-wordmark">
        {TextLogo ? <TextLogo size={56} /> : <strong>{entry.label}</strong>}
      </div>
    </article>
  );
}

export default function LogoLabPage() {
  return (
    <main className="logo-lab-page">
      <section className="logo-lab-shell">
        <nav className="logo-lab-nav" aria-label="Logo lab navigation">
          <a href="/lab/screens">Screens</a>
          <a href="/room">Room</a>
        </nav>
        <header className="logo-lab-hero">
          <span>Looplings model logo lab</span>
          <h1>AI marks with their own little color habitats.</h1>
          <p>
            Lobe Icons gives us React logo components plus brand color keys, so Prime's model screens can show the brain
            in use without looking pasted onto a blank box.
          </p>
        </header>
        <section className="logo-lab-grid" aria-label="AI provider and model logo previews">
          {logoEntries.map((entry) => (
            <LogoCard key={entry.id} entry={entry} />
          ))}
        </section>
      </section>
    </main>
  );
}
