import { el } from "../lib/dom.js";
import { getTheme, toggleTheme } from "../lib/theme.js";

const LINKS = [
    { href: '/index.html', label: '首頁', key: 'home' },
    { href: '/roadmap.html', label: '路線', key: 'roadmap' },
    { href: '/docs.html', label: '教學', key: 'docs' },
    { href: '/about.html', label: '關於', key: 'about' },
];

// mount = the <div id="site-header">, active = current page key
export function renderHeader(mount, active) {
    const themeBtn = el('button', {
        className: 'theme-toggle',
        title: '切換深色/淺色',
        onclick: () => { toggleTheme(); themeBtn.textContent = getTheme() === 'dark' ? '☀' : '☾'; },
    }, getTheme() === 'dark' ? '☀' : '☾');

    const nav = el('nav', { className: 'nav wrap' },
        el('a', { href: '/', className: 'nav-brand' }, 'Robotics from Scratch'),
        el('span', { className: 'nav-links' },
            ...LINKS.map(l =>
                el('a', {
                    href: l.href,
                    className: l.key === active ? 'nav-link is-active' : 'nav-link',
                }, l.label)
            ),
            themeBtn,
        ),
    );
    mount.replaceChildren(nav);
}
