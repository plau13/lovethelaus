import { getPermalink } from './utils/permalinks';

const kitchenUrl = import.meta.env.PUBLIC_KITCHEN_URL ?? 'http://localhost:3000/kitchen';

export const headerData = {
  links: [
    { text: 'Home', href: getPermalink('/') },
    { text: 'Features', href: getPermalink('/#features') },
    { text: 'How it works', href: getPermalink('/#how-it-works') },
    { text: 'FAQ', href: getPermalink('/#faq') },
    { text: 'Sign in', href: getPermalink('/sign-in') },
  ],
  actions: [{ text: 'Open Kitchen', href: kitchenUrl }],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Features', href: getPermalink('/#features') },
        { text: 'How it works', href: getPermalink('/#how-it-works') },
        { text: 'FAQ', href: getPermalink('/#faq') },
      ],
    },
    {
      title: 'Account',
      links: [
        { text: 'Sign in', href: getPermalink('/sign-in') },
        { text: 'Create account', href: getPermalink('/sign-up') },
        { text: 'Open Kitchen', href: kitchenUrl },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: getPermalink('/privacy') },
        { text: 'Terms', href: getPermalink('/terms') },
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [],
  footNote: '',
};
