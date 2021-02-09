/**
 * If JavaScript is enabled, handle modals with JS instead.
 */
document.addEventListener('click', (event) => {
  const href = event.target.getAttribute('href');
  if (!href) return;

  // Only handle links to modal elements
  if (href[0] === '#' && href !== '#!' && href !== '#') {
    const targetModal = document.querySelector(href);
    if (targetModal && targetModal.classList.contains('modal')) {
      event.preventDefault();
      targetModal.classList.add('is-active');
      document.body.classList.add('no-scroll');
      targetModal.dispatchEvent(new CustomEvent('modal-open', { detail: targetModal, bubbles: true }));
    }
  }

  // Handle closing modals
  if (event.target.dataset.dismiss === 'modal' && event.target.dataset.close === 'Close') {
    const targetModal = event.target.closest('.modal');
    event.preventDefault();
    if (window.location.hash === `#${targetModal.id}`) {
      window.location.hash = '';
    }
    targetModal.classList.remove('is-active');
    document.body.classList.remove('no-scroll');
    targetModal.dispatchEvent(new CustomEvent('modal-close', { detail: targetModal, bubbles: true }));
  }
});
