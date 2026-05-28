import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App smoke test', () => {
  it('renders without crashing and shows key elements', () => {
    render(<App />);

    // Title input should be present (default Burnup placeholder)
    expect(screen.getByLabelText('Chart title')).toBeInTheDocument();

    // Sprint badge should show default count
    expect(
      screen.getByLabelText(/1 sprint — click to edit/i),
    ).toBeInTheDocument();
  });
});
