<svelte:head>
  <title>Credits - AutumnsGrove</title>
  <meta name="description" content="Attribution and credits for fonts and resources used on AutumnsGrove" />
</svelte:head>

<div class="credits-page">
  <header class="page-header">
    <h1>Credits & Attribution</h1>
    <p class="subtitle">Fonts and resources that make this site possible</p>
  </header>

  <section class="credits-section">
    <h2>Font Credits</h2>

    <article class="credit-item" style="font-family: 'Alagard', sans-serif;">
      <h3>Alagard</h3>
      <p class="credit-description">
        A medieval-style pixel font perfect for fantasy and game-inspired designs.
        Used as the default site font.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Hewett Tsoi</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://www.dafont.com/alagard.font" target="_blank" rel="noopener noreferrer">
            DaFont - Alagard
          </a>
        </dd>
        <dt>License</dt>
        <dd>Free for personal and commercial use</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'Cozette', sans-serif;">
      <h3>Cozette</h3>
      <p class="credit-description">
        A bitmap programming font with excellent readability at small sizes.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>The Moonwitch</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://github.com/the-moonwitch/Cozette" target="_blank" rel="noopener noreferrer">
            GitHub - Cozette
          </a>
        </dd>
        <dt>License</dt>
        <dd>MIT License</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'Atkinson Hyperlegible', sans-serif;">
      <h3>Atkinson Hyperlegible</h3>
      <p class="credit-description">
        A typeface designed for greater legibility and readability for low vision readers.
        Created by the Braille Institute.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Braille Institute of America</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://brailleinstitute.org/freefont" target="_blank" rel="noopener noreferrer">
            Braille Institute - Atkinson Hyperlegible
          </a>
        </dd>
        <dt>License</dt>
        <dd>SIL Open Font License 1.1</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'OpenDyslexic', sans-serif;">
      <h3>OpenDyslexic</h3>
      <p class="credit-description">
        A typeface designed to mitigate some of the common reading errors caused by dyslexia.
        Features weighted bottoms to help indicate direction.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Abbie Gonzalez</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://opendyslexic.org/" target="_blank" rel="noopener noreferrer">
            OpenDyslexic.org
          </a>
        </dd>
        <dt>License</dt>
        <dd>SIL Open Font License</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'Lexend', sans-serif;">
      <h3>Lexend</h3>
      <p class="credit-description">
        A variable font designed to improve reading fluency. Research shows it can increase
        reading speed by up to 20% for struggling readers.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Thomas Jockin / Bonnie Shaver-Troup</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://www.lexend.com/" target="_blank" rel="noopener noreferrer">
            Lexend.com
          </a>
        </dd>
        <dt>License</dt>
        <dd>SIL Open Font License</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'Cormorant', serif;">
      <h3>Cormorant</h3>
      <p class="credit-description">
        An elegant display serif inspired by Claude Garamond's work. Perfect for
        long-form reading and fantasy-themed content.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Christian Thalmann (Catharsis Fonts)</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://github.com/CatharsisFonts/Cormorant" target="_blank" rel="noopener noreferrer">
            GitHub - Cormorant
          </a>
        </dd>
        <dt>License</dt>
        <dd>SIL Open Font License 1.1</dd>
      </dl>
    </article>

    <article class="credit-item" style="font-family: 'Quicksand', sans-serif;">
      <h3>Quicksand</h3>
      <p class="credit-description">
        A geometric sans-serif with rounded terminals. Friendly, modern, and highly readable.
      </p>
      <dl class="credit-details">
        <dt>Author</dt>
        <dd>Andrew Paglinawan</dd>
        <dt>Source</dt>
        <dd>
          <a href="https://github.com/andrew-paglinawan/QuicksandFamily" target="_blank" rel="noopener noreferrer">
            GitHub - Quicksand
          </a>
        </dd>
        <dt>License</dt>
        <dd>SIL Open Font License</dd>
      </dl>
    </article>
  </section>
</div>

<style>
  .credits-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.25rem 0;
    font-size: 2rem;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .page-header h1 {
    color: var(--color-text-dark);
  }

  .subtitle {
    margin: 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .subtitle {
    color: var(--color-text-subtle-dark);
  }

  .credits-section {
    background: var(--mobile-menu-bg);
    border-radius: var(--border-radius-standard);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: background-color 0.3s ease;
  }

  :global(.dark) .credits-section {
    background: var(--color-bg-tertiary-dark);
  }

  .credits-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  :global(.dark) .credits-section h2 {
    color: var(--color-text-dark);
    border-color: var(--color-border-dark);
  }

  /* Credit Item Styles */
  .credit-item {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    transition: border-color 0.3s ease;
  }

  :global(.dark) .credit-item {
    border-color: var(--color-border-dark);
  }

  .credit-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .credit-item h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary);
    transition: color 0.3s ease;
  }

  :global(.dark) .credit-item h3 {
    color: var(--color-primary-light);
  }

  .credit-description {
    margin: 0 0 1rem 0;
    color: var(--color-text-muted);
    line-height: 1.6;
    transition: color 0.3s ease;
  }

  :global(.dark) .credit-description {
    color: var(--color-text-muted-dark);
  }

  .credit-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    margin: 0;
    font-size: 0.9rem;
  }

  .credit-details dt {
    font-weight: 600;
    color: var(--color-text);
    transition: color 0.3s ease;
  }

  :global(.dark) .credit-details dt {
    color: var(--color-text-dark);
  }

  .credit-details dd {
    margin: 0;
    color: var(--color-text-muted);
    transition: color 0.3s ease;
  }

  :global(.dark) .credit-details dd {
    color: var(--color-text-muted-dark);
  }

  .credit-details a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  :global(.dark) .credit-details a {
    color: var(--color-primary-light);
  }

  .credit-details a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .credits-page {
      padding: 0 1rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
    }

    .credit-details {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }

    .credit-details dt {
      margin-top: 0.5rem;
    }
  }
</style>
