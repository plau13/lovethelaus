import { getPermalink } from './utils/permalinks';

const kitchenUrl = import.meta.env.PUBLIC_KITCHEN_URL ?? 'http://localhost:3000';

export const headerData = {
  links: [
    { text: 'Home', href: getPermalink('/') },
    { text: 'Features', href: getPermalink('/#features') },
    { text: 'How it works', href: getPermalink('/#how-it-works') },
    { text: 'FAQ', href: getPermalink('/#faq') },
  ],
  actions: [{ text: 'Open Kitchen', href: kitchenUrl, target: '_blank' }],
};

export const footerData = {
  links: [],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: 'Love the Laus · Family recipes, yours to keep.',
};
