const siteHeader = document.querySelector('.site-header');
function updateHeaderHeight() {
  document.documentElement.style.setProperty('--header-height', `${siteHeader.getBoundingClientRect().height}px`);
}
updateHeaderHeight();
if ('ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(siteHeader);
else window.addEventListener('resize', updateHeaderHeight);

const journey = document.querySelector('#journey-animation');
const journeyToggle = document.querySelector('#journey-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const animationSource = journey.getAttribute('src');
const posterSource = 'assets/images/journey-poster.png';
// JavaScript supplies a stop control; the picture source provides a no-JS reduced-motion fallback.
journey.closest('picture').querySelector('source').remove();
let isPlaying = !motionPreference.matches;
function setJourneyPlayback(playing) {
  isPlaying = playing;
  journey.src = playing ? animationSource : posterSource;
  journeyToggle.textContent = playing ? 'Остановить' : 'Воспроизвести';
  journeyToggle.setAttribute('aria-label', playing ? 'Остановить анимацию клиентского пути' : 'Воспроизвести анимацию клиентского пути');
}
setJourneyPlayback(isPlaying);
journeyToggle.hidden = false;
journeyToggle.addEventListener('click', () => setJourneyPlayback(!isPlaying));
motionPreference.addEventListener('change', event => setJourneyPlayback(!event.matches));

const navigation = [...document.querySelectorAll('.site-header nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(e => e.isIntersecting);
    if (!entry) return;
    navigation.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin: '-20% 0px -60% 0px', threshold: 0});
  document.querySelectorAll('.slide').forEach(section => observer.observe(section));
}
